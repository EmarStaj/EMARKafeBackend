import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../../theme.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  
  bool _isProcessing = false;
  final TextEditingController _manualInputCtrl = TextEditingController();

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
      _processQR(barcodes.first.rawValue!);
    }
  }

  void _processQR(String data) {
    setState(() => _isProcessing = true);
    try {
      // Beklenen data formatı siparişin ID'sidir (örn. #1046)
      context.read<AppState>().confirmOrderFromQR(data.trim());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sipariş ($data) başarıyla sisteme alındı!')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Geçersiz kod veya sipariş zaten alınmış.')),
      );
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _isProcessing = false);
      });
    }
  }

  void _showManualInputDialog() {
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Manuel Kod Gir', style: TextStyle(color: EmarColors.espresso)),
        content: TextField(
          controller: _manualInputCtrl,
          decoration: const InputDecoration(
            hintText: 'Sipariş No (Örn: #1046)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: EmarColors.moss),
            onPressed: () {
              Navigator.pop(c);
              if (_manualInputCtrl.text.isNotEmpty) {
                _processQR(_manualInputCtrl.text);
              }
            },
            child: const Text('Onayla'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _manualInputCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Okut (Barista)'),
        backgroundColor: EmarColors.oat,
      ),
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // Scanner overlay
          Container(
            decoration: ShapeDecoration(
              shape: QrScannerOverlayShape(
                borderColor: EmarColors.paprika,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: 250,
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: EmarColors.espresso,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                icon: const Icon(Icons.keyboard),
                label: const Text('Manuel Kod Gir', style: TextStyle(fontSize: 16)),
                onPressed: _showManualInputDialog,
              ),
            ),
          ),
          if (_isProcessing)
            const Center(
              child: CircularProgressIndicator(color: EmarColors.paprika),
            ),
        ],
      ),
    );
  }
}

class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final double overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const QrScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 3.0,
    this.overlayColor = 150, // Alpha for black
    this.borderRadius = 0,
    this.borderLength = 20,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top)
        ..lineTo(rect.right, rect.top);
    }
    return getLeftTopPath(rect)
      ..lineTo(rect.right, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..lineTo(rect.left, rect.top);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final borderWidthSize = width / 2;
    final borderOffset = borderWidth / 2;
    final adjustedBorderLength = borderLength > cutOutSize / 2 + borderWidthSize ? cutOutSize / 2 + borderOffset : borderLength;
    final adjustedCutOutSize = cutOutSize;
    
    final backgroundPaint = Paint()
      ..color = Colors.black.withAlpha(overlayColor.toInt())
      ..style = PaintingStyle.fill;
      
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;
      
    final boxPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.fill
      ..blendMode = BlendMode.dstOut;

    final cutOutRect = Rect.fromCenter(
      center: rect.center,
      width: adjustedCutOutSize,
      height: adjustedCutOutSize,
    );

    canvas
      ..saveLayer(
        rect,
        backgroundPaint,
      )
      ..drawRect(
        rect,
        backgroundPaint,
      )
      ..drawRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
        boxPaint,
      )
      ..restore();
      
    // Draw corners
    // Top Left
    canvas.drawLine(
      Offset(cutOutRect.left, cutOutRect.top + borderOffset),
      Offset(cutOutRect.left + adjustedBorderLength, cutOutRect.top + borderOffset),
      borderPaint,
    );
    canvas.drawLine(
      Offset(cutOutRect.left + borderOffset, cutOutRect.top),
      Offset(cutOutRect.left + borderOffset, cutOutRect.top + adjustedBorderLength),
      borderPaint,
    );
    
    // Top Right
    canvas.drawLine(
      Offset(cutOutRect.right, cutOutRect.top + borderOffset),
      Offset(cutOutRect.right - adjustedBorderLength, cutOutRect.top + borderOffset),
      borderPaint,
    );
    canvas.drawLine(
      Offset(cutOutRect.right - borderOffset, cutOutRect.top),
      Offset(cutOutRect.right - borderOffset, cutOutRect.top + adjustedBorderLength),
      borderPaint,
    );
    
    // Bottom Left
    canvas.drawLine(
      Offset(cutOutRect.left, cutOutRect.bottom - borderOffset),
      Offset(cutOutRect.left + adjustedBorderLength, cutOutRect.bottom - borderOffset),
      borderPaint,
    );
    canvas.drawLine(
      Offset(cutOutRect.left + borderOffset, cutOutRect.bottom),
      Offset(cutOutRect.left + borderOffset, cutOutRect.bottom - adjustedBorderLength),
      borderPaint,
    );
    
    // Bottom Right
    canvas.drawLine(
      Offset(cutOutRect.right, cutOutRect.bottom - borderOffset),
      Offset(cutOutRect.right - adjustedBorderLength, cutOutRect.bottom - borderOffset),
      borderPaint,
    );
    canvas.drawLine(
      Offset(cutOutRect.right - borderOffset, cutOutRect.bottom),
      Offset(cutOutRect.right - borderOffset, cutOutRect.bottom - adjustedBorderLength),
      borderPaint,
    );
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth * t,
      overlayColor: overlayColor,
      borderRadius: borderRadius * t,
      borderLength: borderLength * t,
      cutOutSize: cutOutSize * t,
    );
  }
}
