package com.pgmanagement.saas.modules.complaint.dto.request;

import com.pgmanagement.saas.modules.complaint.entity.ComplaintCategory;
import com.pgmanagement.saas.modules.complaint.entity.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateComplaintRequest {

    @NotBlank(message = "Complaint title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Complaint description is required")
    @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
    private String description;

    @NotNull(message = "Complaint category is required")
    private ComplaintCategory category;

    private ComplaintPriority priority = ComplaintPriority.MEDIUM;
}
