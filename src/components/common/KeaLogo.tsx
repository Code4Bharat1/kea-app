import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';

interface KeaLogoProps {
  size?: 'small' | 'medium' | 'large' | number;
  variant?: 'default' | 'banner' | 'emblem';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const KeaLogo: React.FC<KeaLogoProps> = ({
  size = 'medium',
  variant = 'default',
  style,
  imageStyle,
}) => {
  const getLogoDimensions = () => {
    if (variant === 'emblem') {
      const dim = typeof size === 'number' ? size : size === 'small' ? 40 : size === 'large' ? 80 : 56;
      return { height: dim, width: dim };
    }

    if (typeof size === 'number') {
      return { height: size, width: size * 2.5 };
    }
    switch (size) {
      case 'small':
        return { height: 32, width: 120 };
      case 'large':
        return { height: 60, width: 220 };
      case 'medium':
      default:
        return { height: 44, width: 160 };
    }
  };

  const dimensions = getLogoDimensions();
  const logoSource = variant === 'emblem'
    ? require('../../../assets/kea-logo.png')
    : require('../../../assets/kea-logo-banner.png');

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoSource}
        style={[
          styles.logoImage,
          { height: dimensions.height, width: dimensions.width },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    maxWidth: '100%',
  },
});
