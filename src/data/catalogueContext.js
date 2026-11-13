import { createContext, useContext } from 'react';
import { BUNDLED } from './catalogueApi';

export const CatalogueContext = createContext({ ...BUNDLED, loaded: true });

// { products, categories, banners, settings, source: 'bundled' | 'cache' | 'live', loaded }
export const useCatalogue = () => useContext(CatalogueContext);
