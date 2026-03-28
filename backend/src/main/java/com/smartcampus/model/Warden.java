package com.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "wardens")
public class Warden {
    @Id
    private String id;
    private String username;
    private String name;
    private String email;
    private String password;
    private String role = "ROLE_WARDEN";
}
