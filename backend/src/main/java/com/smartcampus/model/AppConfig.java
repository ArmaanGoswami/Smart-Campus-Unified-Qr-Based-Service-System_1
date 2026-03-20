package com.smartcampus.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "app_config")
public class AppConfig {

    @Id
    private String id;

    // Warden toggle: whether mentor application is required
    private boolean mentorRequired = false;
}

