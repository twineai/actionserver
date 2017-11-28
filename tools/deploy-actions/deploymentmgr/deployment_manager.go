package deploymentmgr

import (
	"fmt"
	"log"

	"github.com/pkg/errors"
	appsv1beta2 "k8s.io/api/apps/v1beta2"
	corev1 "k8s.io/api/core/v1"
	kubeerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type actionDeploymentManager struct {
	kubeClient kubernetes.Interface

	namespace            string
	bucketName           string
	serverVersion        string
	serverImageName      string
	serverSetupImageName string
}

func NewActionDeploymentManager(kubeClient kubernetes.Interface, namespace string, bucketName string) *actionDeploymentManager {
	return &actionDeploymentManager{
		kubeClient:           kubeClient,
		namespace:            namespace,
		bucketName:           bucketName,
		serverImageName:      FlagActionServerImageName,
		serverSetupImageName: FlagActionServerSetupImageName,
		serverVersion:        FlagActionServerVersion,
	}
}

func (mgr *actionDeploymentManager) Run(actionName string, actionId string) error {
	log.Printf("RUNNING: %s - %s", actionName, actionId)

	existing, err := mgr.getActionDeployment(actionName)
	if kubeerrors.IsNotFound(err) {
		return mgr.createDeployment(actionName, actionId)
	} else if err != nil {
		return errors.Wrapf(err, "error getting existing deployment for action '%s'", actionName)
	}
	//if err != nil && err != kubeerrors.IsNotFound() {
	//	log.Fatalf("error getting existing deployment for action '%s': %v", actionName, err)
	//}

	log.Printf("Found existing deployment: %v", existing)
	return nil
}

func (mgr *actionDeploymentManager) imageName() string {
	return fmt.Sprintf("%s:%s", mgr.serverImageName, mgr.serverVersion)
}

func (mgr *actionDeploymentManager) setupImageName() string {
	return fmt.Sprintf("%s:%s", mgr.serverSetupImageName, mgr.serverVersion)
}

func (mgr *actionDeploymentManager) deploymentName(actionName string) string {
	return fmt.Sprintf("action-%s", actionName)
}

func (mgr *actionDeploymentManager) createDeployment(actionName string, actionId string) error {
	deployment := mgr.deployment(actionName, actionId)
	result, err := mgr.kubeClient.AppsV1beta2().Deployments(mgr.namespace).Create(deployment)
	if err != nil {
		return err
	}

	log.Printf("Created deployment: %v", result)
	return nil
}

func (mgr *actionDeploymentManager) deployment(
	actionName string,
	actionId string,
) *appsv1beta2.Deployment {
	actionVolumeName := "action-dir"
	actionPath := "/user_code"
	labels := map[string]string{
		"app":             "actionserver",
		"tier":            "actions",
		"twine-action":    actionName,
		"twine-action-id": actionId,
	}

	return &appsv1beta2.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      mgr.deploymentName(actionName),
			Namespace: mgr.namespace,
			Labels:    labels,
		},
		Spec: appsv1beta2.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: mgr.namespace,
					Labels:    labels,
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: actionVolumeName,
							VolumeSource: corev1.VolumeSource{
								EmptyDir: &corev1.EmptyDirVolumeSource{},
							},
						},
					},
					InitContainers: []corev1.Container{
						{
							Name:  "setup",
							Image: mgr.setupImageName(),
							Env: []corev1.EnvVar{
								{
									Name:  "BUCKET_NAME",
									Value: mgr.bucketName,
								},
								{
									Name:  "ACTION_DIR",
									Value: actionPath,
								},
								{
									Name:  "ACTIONS",
									Value: actionName,
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      actionVolumeName,
									MountPath: actionPath,
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:  "actionserver",
							Image: mgr.imageName(),
							Env: []corev1.EnvVar{
								{
									Name:  "PORT",
									Value: "8080",
								},
								{
									Name:  "ACTION_DIR",
									Value: actionPath,
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      actionVolumeName,
									MountPath: actionPath,
								},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "grpc",
									Protocol:      corev1.ProtocolTCP,
									ContainerPort: 8080,
								},
							},
						},
					},
				},
			},
		},
	}
}

func (mgr *actionDeploymentManager) getActionDeployment(actionName string) (*appsv1beta2.Deployment, error) {
	deploymentName := mgr.deploymentName(actionName)
	return mgr.kubeClient.AppsV1beta2().
		Deployments(mgr.namespace).
		Get(deploymentName, metav1.GetOptions{})
}

func int32Ptr(i int32) *int32 { return &i }
