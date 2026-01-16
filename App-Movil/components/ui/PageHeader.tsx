import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <ThemedView style={styles.header}>
      <ThemedView style={styles.headerTop}>
        <ThemedText variant="title" weight="bold">
          {title}
        </ThemedText>
      </ThemedView>

      {subtitle && (
        <ThemedText variant="body" color="textSecondary" style={styles.headerSubtitle}>
          {subtitle}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    paddingLeft: 0,
  },
});
