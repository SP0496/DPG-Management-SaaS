package com.pgmanagement.saas.shared.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Data
@Builder
public class PagedResponse<T> {

    private List<T> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;

    public static <S, T> PagedResponse<T> from(Page<S> pageData, Function<S, T> mapper) {
        List<T> mapped = pageData.getContent().stream().map(mapper).toList();
        return PagedResponse.<T>builder()
                .items(mapped)
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .hasNext(pageData.hasNext())
                .hasPrevious(pageData.hasPrevious())
                .build();
    }

    public static <T> PagedResponse<T> ofList(List<T> allItems, int requestedPage, int requestedSize) {
        int safeSize = Math.max(1, Math.min(requestedSize, 100));
        int safePage = Math.max(0, requestedPage);
        long total = allItems.size();
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

        int fromIndex = safePage * safeSize;
        List<T> slice;
        if (fromIndex >= allItems.size()) {
            slice = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + safeSize, allItems.size());
            slice = allItems.subList(fromIndex, toIndex);
        }

        return PagedResponse.<T>builder()
                .items(slice)
                .page(safePage)
                .size(safeSize)
                .totalElements(total)
                .totalPages(totalPages)
                .hasNext((safePage + 1) < totalPages)
                .hasPrevious(safePage > 0 && totalPages > 0)
                .build();
    }
}
