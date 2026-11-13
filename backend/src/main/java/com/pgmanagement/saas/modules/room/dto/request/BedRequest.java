package com.pgmanagement.saas.modules.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BedRequest {

    @NotBlank(message = "Bed code is required")
    @Size(max = 40, message = "Bed code cannot exceed 40 characters")
    private String bedCode;
}
