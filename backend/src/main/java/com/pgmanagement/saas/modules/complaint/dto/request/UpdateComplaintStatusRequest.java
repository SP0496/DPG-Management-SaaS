package com.pgmanagement.saas.modules.complaint.dto.request;

import com.pgmanagement.saas.modules.complaint.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateComplaintStatusRequest {

    @NotNull(message = "Status is required")
    private ComplaintStatus status;

    private String resolutionNotes;
}
