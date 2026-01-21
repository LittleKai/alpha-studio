import React from 'react';
import { useTranslation } from '../../i18n/context';
import UploaderBox from './UploaderBox';

interface MultiImageUploaderProps {
  onPrimarySelect: (file: File | null, dataUrl: string) => void;
  onSecondarySelect: (file: File | null, dataUrl: string) => void;
  primaryImageUrl: string | null;
  secondaryImageUrl: string | null;
  onClearPrimary: () => void;
  onClearSecondary: () => void;
  primaryTitle?: string;
  primaryDescription?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
  enableHostUpload?: boolean;
  onPrimaryHostedUrlChange?: (url: string) => void;
  onSecondaryHostedUrlChange?: (url: string) => void;
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  onPrimarySelect,
  onSecondarySelect,
  primaryImageUrl,
  secondaryImageUrl,
  onClearPrimary,
  onClearSecondary,
  primaryTitle,
  primaryDescription,
  secondaryTitle,
  secondaryDescription,
  enableHostUpload = true,
  onPrimaryHostedUrlChange,
  onSecondaryHostedUrlChange,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UploaderBox
        title={primaryTitle ?? t('transformations.effects.pose.uploader1Title')}
        description={primaryDescription ?? t('transformations.effects.pose.uploader1Desc')}
        imageUrl={primaryImageUrl}
        onImageSelect={onPrimarySelect}
        onClear={onClearPrimary}
        enableHostUpload={enableHostUpload}
        onHostedUrlChange={onPrimaryHostedUrlChange}
      />
      <UploaderBox
        title={secondaryTitle ?? t('transformations.effects.pose.uploader2Title')}
        description={secondaryDescription ?? t('transformations.effects.pose.uploader2Desc')}
        imageUrl={secondaryImageUrl}
        onImageSelect={onSecondarySelect}
        onClear={onClearSecondary}
        enableHostUpload={enableHostUpload}
        onHostedUrlChange={onSecondaryHostedUrlChange}
      />
    </div>
  );
};

export default MultiImageUploader;
