package main

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"cloud.google.com/go/storage"
	"github.com/namsral/flag"
	"google.golang.org/api/iterator"

	"github.com/twineai/actionserver/tools/deploy-actions/deploymentmgr"
)

func isAction(objAttrs *storage.ObjectAttrs) bool {
	return filepath.Ext(objAttrs.Name) == ".zip"
}

func actionName(objAttrs *storage.ObjectAttrs) string {
	path := objAttrs.Name
	ext := filepath.Ext(path)
	name := path[0 : len(path)-len(ext)]
	return name
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Don't print any sort of timestamp information.
	log.SetFlags(0)

	flag.Parse()

	ns := strings.TrimSpace(FlagNamespace)
	if len(ns) == 0 {
		log.Fatalf("Argument 'namespace' is required")
	}

	bucketName := strings.TrimSpace(FlagBucket)
	if len(bucketName) == 0 {
		log.Fatalf("Argument 'bucket' is required")
	}

	log.Printf("Bucket: %s", bucketName)
	log.Printf("Namespace: %s", ns)

	storageClient := OpenStorage(ctx)
	kubeClient := OpenKubeClient(ctx, FlagKubeconfig)
	bucket := storageClient.Bucket(bucketName)
	mgr := deploymentmgr.NewActionDeploymentManager(kubeClient, ns, bucketName)

	iter := bucket.Objects(ctx, nil)
	for {
		objAttrs, iterErr := iter.Next()

		if iterErr == iterator.Done {
			break
		}

		if iterErr != nil {
			log.Fatalf("Error listing objects in bucket '%s': %v", bucketName, iterErr)
		}

		if !isAction(objAttrs) {
			continue
		}

		actionName := actionName(objAttrs)
		actionId := fmt.Sprintf("%s_%s_%d", bucketName, objAttrs.Name, objAttrs.Generation)

		log.Printf("Object: %s [%s] - %s", objAttrs.Name, actionName, actionId)

		err := mgr.Run(actionName, actionId)
		if err != nil {
			log.Fatalf("Error: %v", err)
		}
	}

	//storage.Bucket()

	//	logger := plainLogger.Sugar()
	//	defer plainLogger.Sync()
	//
	//	wg := sync.WaitGroup{}
	//	ctx, cancel := context.WithCancel(context.Background())
	//	defer cancel()
	//
	//	errors := make(chan error)
	//
	//	kamailioClient := kamailio.NewKamailioClient(logger)
	//	asteriskWatcher := NewAsteriskWatcher(
	//		flags.Kubeconfig,
	//		logger,
	//		flags.Namespaces)so
	//
	//	incoming := make(chan []string)
	//	outgoing := make(chan []string)
	//	signalChan := make(chan os.Signal, 1)
	//
	//	// Run our clients
	//	go asteriskWatcher.Run(ctx, wg, incoming, errors)
	//	go kamailioClient.Run(ctx, wg, outgoing, errors)
	//
	//	// Listen for shutdown signals
	//	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)
	//
	//	errc := 0
	//outer:
	//	for {
	//		select {
	//		case addresses := <-incoming:
	//			logger.Infow("Received new IP addresses",
	//				"ips", addresses)
	//			outgoing <- addresses
	//		case <-signalChan:
	//			logger.Info("Shutdown signal received, shutting down...")
	//			cancel()
	//			break outer
	//		case <-errors:
	//			errc = errc + 1
	//			if errc > 5 {
	//				logger.Error("Too many errors received, shutting down...")
	//				break outer
	//			}
	//		}
	//	}
	//
	//	cancel()
	//	wg.Wait()
	return
}
