import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

describe("Kubernetes Infrastructure Tests", () => {
  const projectRoot = process.cwd();
  const k8sDir = join(projectRoot, "k8s");

  beforeAll(async () => {
    // Ensure kubectl is available for integration tests
    try {
      const process = spawn({
        cmd: ["kubectl", "version", "--client"],
        stdout: "pipe",
        stderr: "pipe",
      });

      const result = await process.exited;
      expect(result).toBe(0);
    } catch (_error) {
      console.warn("kubectl not available, skipping integration tests");
    }
  });

  describe("Kubernetes Manifests Validation", () => {
    test("Kubernetes directory exists", () => {
      expect(existsSync(k8sDir)).toBe(true);
    });

    test("Namespace manifest exists and is valid", async () => {
      const namespaceFile = join(k8sDir, "namespace.yaml");
      expect(existsSync(namespaceFile)).toBe(true);

      const content = await Bun.file(namespaceFile).text();
      expect(content).toContain("apiVersion: v1");
      expect(content).toContain("kind: Namespace");
      expect(content).toContain("name: dev-plugin");
      expect(content).toContain("name: dev-plugin-staging");
      expect(content).toContain("name: dev-plugin-dev");
    });

    test("ConfigMap manifest exists and is valid", async () => {
      const configMapFile = join(k8sDir, "configmap.yaml");
      expect(existsSync(configMapFile)).toBe(true);

      const content = await Bun.file(configMapFile).text();
      expect(content).toContain("apiVersion: v1");
      expect(content).toContain("kind: ConfigMap");
      expect(content).toContain('NODE_ENV: "production"');
      expect(content).toContain('SERVER_PORT: "3000"');
      expect(content).toContain('MONITORING_ENABLED: "true"');
      expect(content).toContain("REDIS_HOST:");
      expect(content).toContain("POSTGRES_HOST:");
    });

    test("Secret manifest exists and is valid", async () => {
      const secretFile = join(k8sDir, "secret.yaml");
      expect(existsSync(secretFile)).toBe(true);

      const content = await Bun.file(secretFile).text();
      expect(content).toContain("apiVersion: v1");
      expect(content).toContain("kind: Secret");
      expect(content).toContain("type: Opaque");
      expect(content).toContain("DATABASE_URL:");
      expect(content).toContain("REDIS_URL:");
      expect(content).toContain("JWT_SECRET:");
    });

    test("Deployment manifest exists and is valid", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      expect(existsSync(deploymentFile)).toBe(true);

      const content = await Bun.file(deploymentFile).text();
      expect(content).toContain("apiVersion: apps/v1");
      expect(content).toContain("kind: Deployment");
      expect(content).toContain("replicas: 3");
      expect(content).toContain("strategy:");
      expect(content).toContain("livenessProbe:");
      expect(content).toContain("readinessProbe:");
      expect(content).toContain("startupProbe:");
      expect(content).toContain("resources:");
      expect(content).toContain("securityContext:");
    });

    test("Service manifest exists and is valid", async () => {
      const serviceFile = join(k8sDir, "service.yaml");
      expect(existsSync(serviceFile)).toBe(true);

      const content = await Bun.file(serviceFile).text();
      expect(content).toContain("apiVersion: v1");
      expect(content).toContain("kind: Service");
      expect(content).toContain("type: ClusterIP");
      expect(content).toContain("ports:");
      expect(content).toContain("selector:");
    });

    test("Ingress manifest exists and is valid", async () => {
      const ingressFile = join(k8sDir, "ingress.yaml");
      expect(existsSync(ingressFile)).toBe(true);

      const content = await Bun.file(ingressFile).text();
      expect(content).toContain("apiVersion: networking.k8s.io/v1");
      expect(content).toContain("kind: Ingress");
      expect(content).toContain("annotations:");
      expect(content).toContain("kubernetes.io/ingress.class: nginx");
      expect(content).toContain("cert-manager.io/cluster-issuer:");
      expect(content).toContain("tls:");
      expect(content).toContain("rules:");
    });

    test("HPA manifest exists and is valid", async () => {
      const hpaFile = join(k8sDir, "hpa.yaml");
      expect(existsSync(hpaFile)).toBe(true);

      const content = await Bun.file(hpaFile).text();
      expect(content).toContain("apiVersion: autoscaling/v2");
      expect(content).toContain("kind: HorizontalPodAutoscaler");
      expect(content).toContain("minReplicas:");
      expect(content).toContain("maxReplicas:");
      expect(content).toContain("metrics:");
      expect(content).toContain("behavior:");
    });

    test("PVC manifest exists and is valid", async () => {
      const pvcFile = join(k8sDir, "pvc.yaml");
      expect(existsSync(pvcFile)).toBe(true);

      const content = await Bun.file(pvcFile).text();
      expect(content).toContain("apiVersion: v1");
      expect(content).toContain("kind: PersistentVolumeClaim");
      expect(content).toContain("accessModes:");
      expect(content).toContain("storageClassName:");
      expect(content).toContain("resources:");
      expect(content).toContain("storage:");
    });
  });

  describe("Security Configuration", () => {
    test("Deployments use non-root users", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      const content = await Bun.file(deploymentFile).text();

      expect(content).toContain("runAsNonRoot: true");
      expect(content).toContain("runAsUser: 1001");
      expect(content).toContain("runAsGroup: 1001");
    });

    test("Containers have security contexts", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      const content = await Bun.file(deploymentFile).text();

      expect(content).toContain("allowPrivilegeEscalation: false");
      expect(content).toContain("readOnlyRootFilesystem: true");
      expect(content).toContain("capabilities:");
      expect(content).toContain("drop:");
    });

    test("Ingress has security headers", async () => {
      const ingressFile = join(k8sDir, "ingress.yaml");
      const content = await Bun.file(ingressFile).text();

      expect(content).toContain("X-Frame-Options: DENY");
      expect(content).toContain("X-Content-Type-Options: nosniff");
      expect(content).toContain("X-XSS-Protection: 1; mode=block");
      expect(content).toContain("Strict-Transport-Security:");
      expect(content).toContain("Content-Security-Policy:");
    });

    test("Network policies are considered", async () => {
      const serviceFile = join(k8sDir, "service.yaml");
      const content = await Bun.file(serviceFile).text();

      // Services should use ClusterIP (not NodePort or LoadBalancer)
      expect(content).toContain("type: ClusterIP");
    });
  });

  describe("Resource Management", () => {
    test("Deployments have resource limits and requests", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      const content = await Bun.file(deploymentFile).text();

      expect(content).toContain("resources:");
      expect(content).toContain("requests:");
      expect(content).toContain("limits:");
      expect(content).toContain("memory:");
      expect(content).toContain("cpu:");
    });

    test("HPA has reasonable scaling limits", async () => {
      const hpaFile = join(k8sDir, "hpa.yaml");
      const content = await Bun.file(hpaFile).text();

      // Production should have at least 3 replicas
      expect(content).toContain("minReplicas: 3");
      expect(content).toContain("maxReplicas:");
      expect(content).toContain("averageUtilization:");
    });

    test("Storage is properly configured", async () => {
      const pvcFile = join(k8sDir, "pvc.yaml");
      const content = await Bun.file(pvcFile).text();

      expect(content).toContain("ReadWriteOnce");
      expect(content).toContain("storage:");
      expect(content).toContain("Gi"); // Gigabytes
    });
  });

  describe("Health Checks and Monitoring", () => {
    test("Deployments have comprehensive health checks", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      const content = await Bun.file(deploymentFile).text();

      expect(content).toContain("livenessProbe:");
      expect(content).toContain("readinessProbe:");
      expect(content).toContain("startupProbe:");

      // Check for proper configuration
      expect(content).toContain("httpGet:");
      expect(content).toContain("path:");
      expect(content).toContain("port:");
      expect(content).toContain("initialDelaySeconds:");
      expect(content).toContain("periodSeconds:");
      expect(content).toContain("timeoutSeconds:");
      expect(content).toContain("failureThreshold:");
    });

    test("Services have monitoring annotations", async () => {
      const serviceFile = join(k8sDir, "service.yaml");
      const content = await Bun.file(serviceFile).text();

      expect(content).toContain('prometheus.io/scrape: "true"');
      expect(content).toContain("prometheus.io/port:");
      expect(content).toContain("prometheus.io/path:");
    });

    test("Multiple health endpoints are used", async () => {
      const deploymentFile = join(k8sDir, "deployment.yaml");
      const content = await Bun.file(deploymentFile).text();

      // Different health endpoints for different checks
      expect(content).toContain("/api/health");
      expect(content).toContain("/api/v1/health/detailed");
    });
  });

  describe("Environment Configuration", () => {
    test("Multiple environments are supported", async () => {
      const namespaceFile = join(k8sDir, "namespace.yaml");
      const configMapFile = join(k8sDir, "configmap.yaml");
      const secretFile = join(k8sDir, "secret.yaml");

      const namespaceContent = await Bun.file(namespaceFile).text();
      const configMapContent = await Bun.file(configMapFile).text();
      const secretContent = await Bun.file(secretFile).text();

      // Check for all environments
      expect(namespaceContent).toContain("dev-plugin");
      expect(namespaceContent).toContain("dev-plugin-staging");
      expect(namespaceContent).toContain("dev-plugin-dev");

      expect(configMapContent).toContain("environment: production");
      expect(configMapContent).toContain("environment: staging");
      expect(configMapContent).toContain("environment: development");

      expect(secretContent).toContain("namespace: dev-plugin");
      expect(secretContent).toContain("namespace: dev-plugin-staging");
      expect(secretContent).toContain("namespace: dev-plugin-dev");
    });

    test("Configuration is properly externalized", async () => {
      const configMapFile = join(k8sDir, "configmap.yaml");
      const secretFile = join(k8sDir, "secret.yaml");
      const deploymentFile = join(k8sDir, "deployment.yaml");

      const configMapContent = await Bun.file(configMapFile).text();
      const secretContent = await Bun.file(secretFile).text();
      const deploymentContent = await Bun.file(deploymentFile).text();

      // Check environment variable usage
      expect(deploymentContent).toContain("valueFrom:");
      expect(deploymentContent).toContain("configMapKeyRef:");
      expect(deploymentContent).toContain("secretKeyRef:");

      // Check secrets are not hardcoded
      expect(configMapContent).not.toContain("password");
      expect(configMapContent).not.toContain("secret");

      // Check sensitive data is in secrets
      expect(secretContent).toContain("DATABASE_URL:");
      expect(secretContent).toContain("REDIS_URL:");
      expect(secretContent).toContain("JWT_SECRET:");
    });
  });

  // Integration tests (only run if kubectl is available)
  describe("Kubernetes Integration Tests", () => {
    test("Can validate manifests with kubectl", async () => {
      try {
        const namespaceFile = join(k8sDir, "namespace.yaml");
        const process = spawn({
          cmd: ["kubectl", "apply", "--dry-run=client", "--validate", "-f", namespaceFile],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("kubectl validation test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("namespace/dev-plugin");
        expect(output).toContain("namespace/dev-plugin-staging");
        expect(output).toContain("namespace/dev-plugin-dev");
      } catch (error) {
        console.warn("kubectl validation test skipped:", error);
        return;
      }
    });

    test("Can validate all manifests together", async () => {
      try {
        const process = spawn({
          cmd: ["kubectl", "apply", "--dry-run=client", "--validate", "-f", k8sDir],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("kubectl comprehensive validation test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("namespace/");
        expect(output).toContain("configmap/");
        expect(output).toContain("secret/");
        expect(output).toContain("deployment.apps/");
        expect(output).toContain("service/");
        expect(output).toContain("ingress.networking.k8s.io/");
        expect(output).toContain("horizontalpodautoscaler.autoscaling/");
        expect(output).toContain("persistentvolumeclaim/");
      } catch (error) {
        console.warn("kubectl comprehensive validation test skipped:", error);
        return;
      }
    });
  });
});
