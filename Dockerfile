# Stage 1: Build the Spring Boot JAR with Maven & Java 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime with BOTH Java 21 AND Node.js 22 (for worker subprocesses)
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache nodejs npm
WORKDIR /app

# Copy the built Spring Boot JAR and the Node.js scheduling workers
COPY --from=build /build/target/backend-0.1.0.jar ./app.jar
COPY workers ./workers

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
