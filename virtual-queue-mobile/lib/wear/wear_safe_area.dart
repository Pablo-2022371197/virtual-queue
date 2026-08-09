import 'package:flutter/material.dart';
import 'package:wear_plus/wear_plus.dart';

/// Safe insets for Wear screens. Round faces get a proportional inset;
/// square faces keep a modest fixed padding.
class WearInsets {
  WearInsets._();

  static EdgeInsets forShape(WearShape shape, Size size) {
    const squareInset = 12.0;
    if (shape == WearShape.square) {
      return const EdgeInsets.all(squareInset);
    }
    final roundInset = (size.shortestSide * 0.10).clamp(24.0, 36.0);
    return EdgeInsets.all(roundInset);
  }
}

/// Centers child content inside a shape-aware safe area.
class WearSafeArea extends StatelessWidget {
  const WearSafeArea({
    super.key,
    required this.child,
    this.scrollable = true,
  });

  final Widget child;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    return WatchShape(
      builder: (context, shape, _) {
        return LayoutBuilder(
          builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            final insets = WearInsets.forShape(shape, size);
            final content = Padding(
              padding: insets,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: constraints.maxWidth - insets.horizontal,
                  minHeight: constraints.maxHeight - insets.vertical,
                ),
                child: Center(child: child),
              ),
            );

            if (!scrollable) return content;

            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: content,
            );
          },
        );
      },
    );
  }
}
