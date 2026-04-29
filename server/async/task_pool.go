// Package async 提供轻量级 Goroutine 异步任务池。
//
// 用于非核心逻辑的异步处理，不阻塞主请求流程。
package async

import (
	"log"
	"runtime/debug"
)

const (
	// DefaultQueueSize 默认队列大小
	DefaultQueueSize = 100
	// DefaultWorkerNum 默认 Worker 数量
	DefaultWorkerNum = 5
)

var (
	taskChan chan func()
)

func init() {
	Init(DefaultQueueSize, DefaultWorkerNum)
}

// Init 初始化任务池
func Init(queueSize int, workerNum int) {
	taskChan = make(chan func(), queueSize)

	// 启动 Worker
	for i := 0; i < workerNum; i++ {
		go worker()
	}

	log.Printf("[async] task pool initialized: queue=%d, workers=%d",
		queueSize, workerNum)
}

// worker 消费任务
func worker() {
	for task := range taskChan {
		safeRun(task)
	}
}

// safeRun 安全执行任务，捕获 panic
func safeRun(task func()) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[async] task panic recovered: %v\n%s",
				r, debug.Stack())
		}
	}()

	task()
}

// Submit 提交异步任务（无重试）
// 如果队列满了，任务会被丢弃并打 warn 日志
func Submit(task func()) {
	select {
	case taskChan <- task:
		// 提交成功
	default:
		log.Printf("[async] WARN: task queue full, task dropped")
	}
}

// SubmitWithRetry 提交带重试的任务
// maxRetry: 最大重试次数，0 表示不重试只执行一次
func SubmitWithRetry(task func(), maxRetry int) {
	retryTask := func() {
		var err error
		for i := 0; i <= maxRetry; i++ {
			func() {
				defer func() {
					if r := recover(); r != nil {
						err = r.(error)
					}
				}()
				task()
				err = nil
			}()

			if err == nil {
				return
			}

			if i < maxRetry {
				log.Printf("[async] task failed, retry %d/%d: %v",
					i+1, maxRetry, err)
			}
		}

		log.Printf("[async] task failed after %d retries: %v",
			maxRetry+1, err)
	}

	Submit(retryTask)
}

// QueueSize 返回当前队列长度（用于监控）
func QueueSize() int {
	return len(taskChan)
}
