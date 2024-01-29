import { Construct } from 'constructs';
import { App, Chart } from 'cdk8s';
import { IntOrString, KubeDeployment, KubeIngress, KubeIngressClass, KubeService } from './imports/k8s';

class MyChart extends Chart {
  constructor(scope: Construct, ns: string, appLabel: string) {
    super(scope, ns);

    // Define a Kubernetes Deployment
    new KubeDeployment(this, 'pod-info', {
      metadata: {
        labels: { app: appLabel }
      },
      spec: {
        replicas: 3,
        selector: { matchLabels: { app: appLabel } },
        template: {
          metadata: { labels: { app: appLabel } },
          spec: {
            containers: [
              {
                name: 'pod-info',
                image: 'kimschles/pod-info-app:0.0.5',
                ports: [{
                  containerPort: 3000,
                  name: 'podInfoPort'
                }],
                env: [
                  {
                    name: 'POD_NAME',
                    valueFrom: { fieldRef: { fieldPath: 'metadata.name' } }
                  },
                  {
                    name: 'POD_NAMESPACE',
                    valueFrom: { fieldRef: { fieldPath: 'metadata.namespace' } }
                  },
                  {
                    name: 'POD_IP',
                    valueFrom: { fieldRef: { fieldPath: 'status.podIP' } }
                  }
                ]
              }
            ]
          }
        }
      }
    });

    const service = new KubeService(this, "pod-info-service", {
      metadata: {
        labels: { app: appLabel }
      },
      spec: {
        selector: { app: 'pod-info' },
        ports: [{
          protocol: 'TCP',
          port: 80,
          name: 'podInfoServicePort',
          targetPort: IntOrString.fromString('podInfoPort')
        }]
      }
    });

    const ingressClass = new KubeIngressClass(this, "nginx-ingress", {
      metadata: {
        labels: { app: appLabel },
        annotations: { 'ingressclass.kubernetes.io/is-default-class': 'true' }
      },
      spec: { controller: 'k8s.io/ingress-nginx' }
    });

    new KubeIngress(this, "pod-info-ingress", {
      metadata: {
        annotations: { 'nginx.ingress.kubernetes.io/rewrite-target': '/' }
      },
      spec: {
        ingressClassName: ingressClass.name,
        rules: [{
          http: {
            paths: [{
              path: '/podinfo',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: service.name,
                  port: { number: 80 }
                }
              }
            }]
          }
        }]
      }
    })
  }
}

const app = new App();
new MyChart(app, 'dev-k8s', 'pod-info');

app.synth();