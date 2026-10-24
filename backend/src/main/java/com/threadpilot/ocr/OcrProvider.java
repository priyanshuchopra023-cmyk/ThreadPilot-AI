package com.threadpilot.ocr;

import org.springframework.web.multipart.MultipartFile;

public interface OcrProvider {

    String getName();

    OcrResult process(MultipartFile file);

    OcrResult process(byte[] fileData, String mimeType);

    boolean isAvailable();

    void validateConfiguration();
}

