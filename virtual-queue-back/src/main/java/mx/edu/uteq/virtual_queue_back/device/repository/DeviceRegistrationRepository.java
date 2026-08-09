package mx.edu.uteq.virtual_queue_back.device.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import mx.edu.uteq.virtual_queue_back.device.entity.DeviceRegistration;

public interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, UUID> {

	Optional<DeviceRegistration> findByFcmToken(String fcmToken);

	List<DeviceRegistration> findByUserIdAndActiveTrue(UUID userId);
}
