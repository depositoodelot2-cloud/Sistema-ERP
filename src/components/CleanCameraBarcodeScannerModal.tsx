import React from 'react';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

interface CleanCameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export const CleanCameraBarcodeScannerModal: React.FC<CleanCameraBarcodeScannerModalProps> = (props) => {
  return <CameraBarcodeScannerModal {...props} />;
};
