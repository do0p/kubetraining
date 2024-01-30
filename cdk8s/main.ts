import { Construct } from 'constructs';
import { App, Chart } from 'cdk8s';
import { IntOrString, KubeDeployment, KubeIngress, KubeIngressClass, KubeService } from './imports/k8s';

class MyChart extends Chart {
  constructor(scope: Construct, ns: string, appLabel: string) {
    super(scope, ns);

    new KubeDeployment(this, 'pod-info', {
      metadata: {
        labels: { app: appLabel },
        namespace: ns
      },
      spec: {
        replicas: 5,
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
                  name: 'podinfo-port'
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
        labels: { app: appLabel },
        namespace: ns
      },
      spec: {
        selector: { app: 'pod-info' },
        ports: [{
          protocol: 'TCP',
          port: 80,
          name: 'service-port',
          targetPort: IntOrString.fromString('podinfo-port')
        }]
      }
    });

    const ingressClass = new KubeIngressClass(this, "nginx-ingress", {
      metadata: {
        labels: { app: appLabel },
        annotations: { 'ingressclass.kubernetes.io/is-default-class': 'true' },
        namespace: ns
      },
      spec: { controller: 'k8s.io/ingress-nginx' }
    });

    new KubeIngress(this, "pod-info-ingress", {
      metadata: {
        annotations: { 'nginx.ingress.kubernetes.io/rewrite-target': '/' },
        namespace: ns
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
                  port: { name: 'service-port' }
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
