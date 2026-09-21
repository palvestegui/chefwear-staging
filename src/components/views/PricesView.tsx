import React from 'react';
import { PriceReference } from '../PriceReference';

export interface PricesViewProps {
  pricing: any;
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
