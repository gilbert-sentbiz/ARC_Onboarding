package com.sentbe.arc.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import java.net.URI

@Configuration
class S3Config(
    @Value("\${arc.s3.endpoint}") private val endpoint: String,
    @Value("\${arc.s3.access-key}") private val accessKey: String,
    @Value("\${arc.s3.secret-key}") private val secretKey: String,
    @Value("\${arc.s3.region}") private val region: String
) {
    @Bean
    fun s3Client(): S3Client = S3Client.builder()
        .endpointOverride(URI.create(endpoint))
        .credentialsProvider(
            StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
        )
        .region(Region.of(region))
        .forcePathStyle(true)   // MinIO는 path-style 필수
        .build()
}
