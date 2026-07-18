class SessionManager {
  SessionManager._();

  static DateTime? _sessionStart;

  static void startSession() {
    _sessionStart = DateTime.now();
  }

  static bool isSessionValid() {
    if (_sessionStart == null) return false;
    final elapsed = DateTime.now().difference(_sessionStart!);
    return elapsed.inMinutes < 30;
  }

  static void endSession() {
    _sessionStart = null;
  }
}
