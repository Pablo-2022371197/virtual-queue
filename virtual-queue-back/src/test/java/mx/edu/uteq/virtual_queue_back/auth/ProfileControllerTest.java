package mx.edu.uteq.virtual_queue_back.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import mx.edu.uteq.virtual_queue_back.security.UserPrincipal;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	private User testUser;

	@BeforeEach
	void setUp() {
		testUser = userRepository.findByUsername("profileuser")
				.orElseGet(() -> userRepository.save(User.builder()
						.id(java.util.UUID.randomUUID())
						.fullName("Profile User")
						.email("profile@example.com")
						.username("profileuser")
						.passwordHash("$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC")
						.role(mx.edu.uteq.virtual_queue_back.common.UserRole.CUSTOMER)
						.enabled(true)
						.build()));
	}

	@Test
	void updateProfileChangesUsername() throws Exception {
		String body = """
				{
				  "fullName": "Updated Name",
				  "username": "profileuser_updated"
				}
				""";

		mockMvc.perform(patch("/api/auth/me")
						.with(user(userPrincipal()))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.fullName").value("Updated Name"))
				.andExpect(jsonPath("$.username").value("profileuser_updated"));

		testUser.setUsername("profileuser");
		userRepository.save(testUser);
	}

	@Test
	void changePasswordWithWrongCurrentPasswordReturns401() throws Exception {
		String body = """
				{
				  "currentPassword": "wrong",
				  "newPassword": "newpassword123"
				}
				""";

		mockMvc.perform(put("/api/auth/password")
						.with(user(userPrincipal()))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void changePasswordSucceeds() throws Exception {
		String body = """
				{
				  "currentPassword": "password",
				  "newPassword": "newpassword123"
				}
				""";

		mockMvc.perform(put("/api/auth/password")
						.with(user(userPrincipal()))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isNoContent());

		String revert = """
				{
				  "currentPassword": "newpassword123",
				  "newPassword": "password"
				}
				""";

		mockMvc.perform(put("/api/auth/password")
						.with(user(userPrincipal()))
						.contentType(MediaType.APPLICATION_JSON)
						.content(revert))
				.andExpect(status().isNoContent());
	}

	private UserPrincipal userPrincipal() {
		return new UserPrincipal(testUser);
	}
}
