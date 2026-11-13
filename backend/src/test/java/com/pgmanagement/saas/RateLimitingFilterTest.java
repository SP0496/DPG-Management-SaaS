package com.pgmanagement.saas;

import com.pgmanagement.saas.shared.security.RateLimitingFilter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class RateLimitingFilterTest {

    @Test
    void blocksExcessRequestsOnFirebaseAuthRoute() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(2, 100);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/auth/firebase/verify");
            req.setServletPath("/auth/firebase/verify");
            req.setRemoteAddr("192.168.10.50");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/auth/firebase/verify");
        blockedReq.setServletPath("/auth/firebase/verify");
        blockedReq.setRemoteAddr("192.168.10.50");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
    }
}
