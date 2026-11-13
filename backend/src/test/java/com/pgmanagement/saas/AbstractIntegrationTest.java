package com.pgmanagement.saas;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenDetails;
import com.pgmanagement.saas.modules.auth.firebase.FirebaseTokenVerifier;
import com.pgmanagement.saas.modules.users.entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @MockBean
    protected FirebaseTokenVerifier firebaseTokenVerifier;

    protected record AuthSession(String accessToken, String refreshToken, String userId, String role, String phone, boolean newUser) {
    }

    protected AuthSession authenticateWithFirebase(
            String uid,
            String phone,
            String fullName,
            Role verifiedClaimRole,
            String inviteCode) throws Exception {
        String idToken = "firebase-id-token-" + uid;
        when(firebaseTokenVerifier.verifyIdToken(idToken))
                .thenReturn(new FirebaseTokenDetails(uid, phone, null, fullName, verifiedClaimRole));

        Map<String, Object> body = new HashMap<>();
        body.put("firebaseIdToken", idToken);
        if (fullName != null) {
            body.put("fullName", fullName);
        }
        if (inviteCode != null) {
            body.put("inviteCode", inviteCode);
        }

        MvcResult result = mockMvc.perform(post("/auth/firebase/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        return new AuthSession(
                data.path("accessToken").asText(),
                data.path("refreshToken").asText(),
                data.path("user").path("id").asText(),
                data.path("user").path("role").asText(),
                data.path("user").path("phone").asText(),
                data.path("newUser").asBoolean()
        );
    }

    protected AuthSession authenticateAllowlistedOwnerOne() throws Exception {
        return authenticateWithFirebase("uid-owner-1", "+919800000001", "Primary PG Owner", null, null);
    }

    protected AuthSession authenticateAllowlistedOwnerTwo() throws Exception {
        return authenticateWithFirebase("uid-owner-2", "+919800000002", "Secondary PG Owner", null, null);
    }

    protected String extractId(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("id").asText();
    }

    protected JsonNode extractData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }
}
