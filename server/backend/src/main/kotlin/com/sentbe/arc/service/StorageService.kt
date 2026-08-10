package com.sentbe.arc.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest

@Service
class StorageService(
    private val s3Client: S3Client,
    @Value("\${arc.s3.bucket}") private val bucket: String
) {
    companion object {
        private val ALLOWED_MIME_TYPES = setOf("application/pdf", "image/png", "image/jpeg")
        private const val MAX_FILE_SIZE = 10L * 1024 * 1024  // 10MB
    }

    /**
     * 파일을 S3(MinIO)에 업로드하고 storage key를 반환.
     * 호출 전 validateFile() 체크 선행 필요.
     */
    fun upload(key: String, file: MultipartFile): String {
        val request = PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType(file.contentType ?: "application/octet-stream")
            .contentLength(file.size)
            .build()
        s3Client.putObject(request, RequestBody.fromBytes(file.bytes))
        return key
    }

    fun validateFile(file: MultipartFile) {
        val mime = file.contentType ?: ""
        if (mime !in ALLOWED_MIME_TYPES) {
            throw IllegalArgumentException("허용 파일 형식: pdf, png, jpg. 전달된 형식: $mime")
        }
        if (file.size > MAX_FILE_SIZE) {
            throw IllegalArgumentException("파일 크기 한도 초과: 최대 10MB (전달: ${file.size / 1024 / 1024}MB)")
        }
    }
}
