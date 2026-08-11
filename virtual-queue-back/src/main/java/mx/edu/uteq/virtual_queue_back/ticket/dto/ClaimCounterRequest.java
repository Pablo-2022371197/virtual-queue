package mx.edu.uteq.virtual_queue_back.ticket.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ClaimCounterRequest(@NotNull @Min(1) Integer counterNumber) {
}
