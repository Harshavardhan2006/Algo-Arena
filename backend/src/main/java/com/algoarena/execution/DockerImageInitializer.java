package com.algoarena.execution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

@Component
public class DockerImageInitializer {

    private static final Logger log = LoggerFactory.getLogger(DockerImageInitializer.class);

    @Value("${algoarena.execution.docker-image}")
    private String dockerImage;

    @Value("${algoarena.execution.workers-base-path}")
    private String workersBasePath;

    @EventListener(ApplicationReadyEvent.class)
    public void buildImage() {
        Path context = Path.of(workersBasePath).toAbsolutePath().normalize();
        try {
            Process process = new ProcessBuilder("docker", "build", "-t", dockerImage, context.toString())
                    .redirectErrorStream(true)
                    .start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (process.waitFor() == 0) {
                log.info("worker image {} is ready", dockerImage);
            } else {
                log.error("worker image build failed:\n{}", output);
            }
        } catch (Exception e) {
            log.error("could not run docker: {}", e.getMessage());
        }
    }
}