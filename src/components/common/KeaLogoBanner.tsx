import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export const KeaLogoBanner: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[styles.bannerContainer, style]}>
      <Image
        source={require('../../../assets/logo1.png')}
        style={styles.logoBannerImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  logoBannerImage: {
    width: 260,
    height: 72,
  },
});
