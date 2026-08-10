package com.sentbe.arc.domain

import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "document_file")
class DocumentFile {
    @Id
    var id: UUID = UUID.randomUUID()

    @Column(name = "document_id", nullable = false)
    var documentId: UUID = UUID.randomUUID()

    @Column(name = "file_name", nullable = false)
    var fileName: String = ""

    @Column(name = "file_size", nullable = false)
    var fileSize: Int = 0

    @Column(name = "mime_type", nullable = false)
    var mimeType: String = ""

    @Column(name = "storage_key", nullable = false)
    var storageKey: String = ""

    @Column(name = "uploader_type", nullable = false)
    var uploaderType: String = "CUSTOMER"

    @Column(name = "uploader_staff_id")
    var uploaderStaffId: UUID? = null

    @Column(name = "is_latest", nullable = false)
    var isLatest: Boolean = true

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    var uploadedAt: OffsetDateTime = OffsetDateTime.now()
}
