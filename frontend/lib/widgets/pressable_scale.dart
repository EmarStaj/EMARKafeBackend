import 'package:flutter/material.dart';

/// Dokunulduğunda hafifçe küçülen, bırakılınca yumuşakça geri dönen görsel sarmalayıcı.
/// Ham pointer olaylarını dinler (gesture arena'ya girmez), böylece içindeki
/// buton/InkWell kendi dokunma/onPressed davranışını normal şekilde korur.
class PressableScale extends StatefulWidget {
  final Widget child;
  const PressableScale({super.key, required this.child});

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  double _scale = 1;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => setState(() => _scale = 0.96),
      onPointerUp: (_) => setState(() => _scale = 1),
      onPointerCancel: (_) => setState(() => _scale = 1),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
