FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache nodejs npm
WORKDIR /app
COPY --from=build /build/target/backend-0.1.0.jar ./app.jar
COPY workers /app/workers
COPY workers /workers
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]