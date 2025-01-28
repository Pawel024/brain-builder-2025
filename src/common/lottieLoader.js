import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LottieLoader = () => (
    <DotLottieReact
        src='/loading.lottie'
        loop
        autoplay
    />
);

export default LottieLoader;