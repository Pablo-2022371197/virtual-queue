import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../http/dioClient.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class FcmService {
  FcmService(this._dio, this._notifications);

  final Dio _dio;
  final FlutterLocalNotificationsPlugin _notifications;

  static Future<void> registerBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    return Future.value();
  }

  Future<void> init() async {
    await Firebase.initializeApp();

    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission();

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return;
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await _notifications.initialize(initSettings);

    final token = await messaging.getToken();
    if (token == null) {
      return;
    }

    await _registerToken(token);

    FirebaseMessaging.onMessage.listen((message) async {
      final notification = message.notification;
      if (notification == null) {
        return;
      }

      await _notifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'virtual_queue',
            'Virtual Queue',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    });
  }

  Future<void> _registerToken(String fcmToken) async {
    await _dio.post(
      '/api/devices/register',
      data: {
        'fcmToken': fcmToken,
        'platform': defaultTargetPlatform == TargetPlatform.android
            ? 'ANDROID'
            : 'IOS',
      },
    );
  }
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  final dio = ref.watch(dioProvider);
  return FcmService(dio, FlutterLocalNotificationsPlugin());
});
