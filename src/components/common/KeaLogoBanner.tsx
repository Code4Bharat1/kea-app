import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';

export interface KeaLogoBannerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const KeaLogoBanner: React.FC<KeaLogoBannerProps> = ({
  size = 'large',
  style,
  imageStyle,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 175, height: 75 };
      case 'medium':
        return { width: 235, height: 100 };
      case 'xlarge':
        return { width: 330, height: 140 };
      case 'large':
      default:
        return { width: 290, height: 124 };
    }
  };

  const dim = getDimensions();

  return (
    <View style={[styles.bannerContainer, style]}>
      <Image
        source={require('../../../assets/kea-logo.png')}
        style={[styles.logoBannerImage, { width: dim.width, height: dim.height }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoBannerImage: {
    maxWidth: '100%',
  },
});
