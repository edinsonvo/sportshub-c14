package com.sporthub;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SportHubApplicationTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void contextLoadsYHealthResponde() {
        @SuppressWarnings("rawtypes")
        var response = restTemplate.getForEntity("/api/v1/health", java.util.Map.class);
        org.assertj.core.api.Assertions.assertThat(response.getStatusCode().value())
                .isEqualTo(200);
    }
}
