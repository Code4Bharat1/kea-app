import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';

export interface KeaLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  variant?: 'default' | 'banner' | 'emblem';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const KeaLogo: React.FC<KeaLogoProps> = ({
  size = 'medium',
  variant = 'banner',
  style,
  imageStyle,
}) => {
  const getLogoDimensions = () => {
    if (typeof size === 'number') {
      return { height: size, width: size * 2.33 };
    }
    switch (size) {
      case 'small':
        return { height: 40, width: 93 };
      case 'large':
        return { height: 95, width: 221 };
      case 'xlarge':
        return { height: 135, width: 314 };
      case 'medium':
      default:
        return { height: 60, width: 140 };
    }
  };

  const dimensions = getLogoDimensions();
  const logoSource = require('../../../assets/kea-logo.png');

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
