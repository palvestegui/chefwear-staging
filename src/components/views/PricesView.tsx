import React from 'react';
import { PriceReference, PriceReferenceProps } from '../PriceReference';

export interface PricesViewProps {
  pricing: PriceReferenceProps['pricing'];
}

export const PricesView: React.FC<PricesViewProps> = ({ pricing }) => {
  return (
    <PriceReference 
      pricing={pricing}
      cataloguePrices={pricing?.garments}
      udiPricing={pricing?.udiPricing}
      specialPresets={pricing?.specialPresets}
      services={pricing?.services}
    />
  );
};
