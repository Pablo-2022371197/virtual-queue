import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import '../../core/auth/auth_service.dart';
import '../wear_safe_area.dart';
import 'pin_storage.dart';
import 'session_manager.dart';

enum PinMode { setup, verify }

class PinScreen extends ConsumerStatefulWidget {
  final PinMode mode;
  const PinScreen({super.key, required this.mode});

  @override
  ConsumerState<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends ConsumerState<PinScreen> {
  String _input = '';
  String? _firstPin;
  String? _error;
  int _failedAttempts = 0;
  bool _blocked = false;
  int _blockSeconds = 30;
  Timer? _blockTimer;

  @override
  void dispose() {
    _blockTimer?.cancel();
    super.dispose();
  }

  String? get _userId => ref.read(authStateProvider).user?.id;

  void _onDigit(String digit) {
    if (_blocked) return;
    if (_input.length >= 4) return;
    setState(() {
      _error = null;
      _input += digit;
    });
    if (_input.length == 4) {
      _submit();
    }
  }

  void _onDelete() {
    if (_blocked) return;
    if (_input.isEmpty) return;
    setState(() {
      _input = _input.substring(0, _input.length - 1);
      _error = null;
    });
  }

  Future<void> _skipPin() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) {
      context.go('/wear/login');
      return;
    }
    await PinStorage.markPinSkipped(userId);
    await ref.read(authStateProvider.notifier).unlock();
    SessionManager.startSession();
    if (mounted) context.go('/wear/home');
  }

  Future<void> _submit() async {
    if (_input.length != 4) return;
    final userId = _userId;
    if (userId == null || userId.isEmpty) {
      context.go('/wear/login');
      return;
    }

    if (widget.mode == PinMode.setup) {
      if (_firstPin == null) {
        setState(() {
          _firstPin = _input;
          _input = '';
        });
      } else {
        if (_input == _firstPin) {
          await PinStorage.savePin(_input, scope: PinScope.wear, userId: userId);
          await ref.read(authStateProvider.notifier).unlock();
          SessionManager.startSession();
          if (mounted) context.go('/wear/home');
        } else {
          setState(() {
            _error = 'Los PIN no coinciden';
            _firstPin = null;
            _input = '';
          });
        }
      }
    } else {
      final valid = await PinStorage.verifyPin(
        _input,
        scope: PinScope.wear,
        userId: userId,
      );
      if (valid) {
        await ref.read(authStateProvider.notifier).unlock();
        SessionManager.startSession();
        if (mounted) context.go('/wear/home');
      } else {
        setState(() {
          _failedAttempts++;
          _input = '';
          _error = 'PIN incorrecto';
        });
        if (_failedAttempts >= 3) {
          _startBlock();
        }
      }
    }
  }

  void _startBlock() {
    setState(() {
      _blocked = true;
      _blockSeconds = 30;
      _error = 'Demasiados intentos';
    });
    _blockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_blockSeconds <= 1) {
        timer.cancel();
        if (mounted) {
          setState(() {
            _blocked = false;
            _failedAttempts = 0;
            _error = null;
          });
        }
      } else {
        setState(() => _blockSeconds--);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isSetup = widget.mode == PinMode.setup;
    final title = isSetup
        ? (_firstPin == null ? 'Configurar PIN' : 'Confirmar PIN')
        : 'Ingresar PIN';
    final subtitle =
        isSetup && _firstPin != null ? 'Ingresa el PIN nuevamente' : null;

    return AmbientMode(
      builder: (context, mode, child) {
        return Scaffold(
          backgroundColor: Colors.black,
          body: WearSafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxHeight < 220;
                final buttonSize = compact ? 36.0 : 42.0;
                final buttonMargin = compact ? 2.0 : 3.0;
                final titleSize = compact ? 12.0 : 14.0;

                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: titleSize,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (subtitle != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(4, (i) {
                        final filled = i < _input.length;
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          width: 9,
                          height: 9,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: filled ? Colors.white : Colors.white24,
                          ),
                        );
                      }),
                    ),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          _blocked ? 'Bloqueado $_blockSeconds s' : _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            color: _blocked ? Colors.orange : Colors.redAccent,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    _buildKeypad(buttonSize, buttonMargin, compact ? 15.0 : 17.0),
                    if (isSetup) ...[
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _skipPin,
                        child: const Text(
                          'Omitir',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildKeypad(double buttonSize, double buttonMargin, double fontSize) {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final row in rows)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (final digit in row)
                _KeypadButton(
                  label: digit,
                  onTap: _blocked ? null : () => _onDigit(digit),
                  size: buttonSize,
                  margin: buttonMargin,
                  fontSize: fontSize,
                ),
            ],
          ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(width: buttonSize + buttonMargin * 2),
            _KeypadButton(
              label: '0',
              onTap: _blocked ? null : () => _onDigit('0'),
              size: buttonSize,
              margin: buttonMargin,
              fontSize: fontSize,
            ),
            _KeypadButton(
              label: '⌫',
              onTap: _blocked ? null : _onDelete,
              size: buttonSize,
              margin: buttonMargin,
              fontSize: fontSize,
            ),
          ],
        ),
      ],
    );
  }
}

class _KeypadButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final double size;
  final double margin;
  final double fontSize;

  const _KeypadButton({
    required this.label,
    this.onTap,
    this.size = 42.0,
    this.margin = 3.0,
    this.fontSize = 17.0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        margin: EdgeInsets.all(margin),
        decoration: BoxDecoration(
          color: onTap != null ? Colors.white12 : Colors.white54,
          shape: BoxShape.circle,
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: fontSize, color: Colors.white),
        ),
      ),
    );
  }
}
