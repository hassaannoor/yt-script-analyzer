import { useState, useEffect } from 'react';

export const useNLP = () => {
  const [nlp, setNlp] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeNLP = async () => {
      try {
        const winkNLP = await import('wink-nlp');
        const winkEngLiteWebModel = await import('wink-eng-lite-web-model');
        
        const nlpInstance = winkNLP.default(winkEngLiteWebModel.default);
        setNlp(nlpInstance);
        setIsLoaded(true);
        console.log('Wink NLP initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Wink NLP:', err);
        setError(err);
        setIsLoaded(false);
      }
    };

    initializeNLP();
  }, []);

  return { nlp, isLoaded, error };
};