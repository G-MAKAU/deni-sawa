import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ExportModel, ReportTextRun } from './lexical-to-model';
import { healthChecks } from '@/data/site';

const ORANGE = '#E8510A';
const GREEN = '#5A9E28';
const DARK = '#1A1A1A';
const MUTED = '#666666';
const LIGHT = '#F9F7F5';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.55,
    color: DARK,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerMark: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },
  headerName: { color: '#FFFFFF', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 },
  headerNameAccent: { color: ORANGE },
  headerTag: { color: '#9A9A9A', fontSize: 6.5, letterSpacing: 2, marginTop: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    color: MUTED,
    fontSize: 7.5,
  },
  h1: { fontSize: 20, fontWeight: 700, color: DARK, marginBottom: 8, marginTop: 4 },
  h2: {
    fontSize: 13,
    fontWeight: 700,
    color: ORANGE,
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  h3: { fontSize: 11.5, fontWeight: 700, color: DARK, marginTop: 14, marginBottom: 4 },
  paragraph: { marginTop: 4, marginBottom: 4 },
  quote: {
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 10,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    backgroundColor: LIGHT,
    fontStyle: 'italic',
    color: DARK,
  },
  callout: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    backgroundColor: '#FDF3EC',
  },
  calloutGrowth: {
    borderLeftColor: GREEN,
    backgroundColor: '#F4F9EE',
  },
  calloutLabel: {
    fontSize: 7,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: ORANGE,
    marginBottom: 3,
    fontWeight: 700,
  },
  calloutLabelGrowth: { color: GREEN },
  calloutText: { fontSize: 10 },
  list: { marginTop: 4, marginBottom: 6 },
  listItem: { flexDirection: 'row', marginBottom: 3 },
  bullet: { width: 8, color: GREEN, fontSize: 10 },
  itemText: { flex: 1 },
  divider: { marginVertical: 12, height: 1, backgroundColor: '#E0E0E0' },
  accentBar: { marginTop: 12, marginBottom: 18, height: 3, width: 48, backgroundColor: ORANGE },
});

function ReportHeader({ title }: { title: string }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerBrand}>
        <View style={styles.headerMark} />
        <View>
          <Text style={styles.headerName}>
            DENI <Text style={styles.headerNameAccent}>SAWA</Text>
          </Text>
          <Text style={styles.headerTag}>P A R T N E R S</Text>
        </View>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function ReportFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Deni Sawa Partners · Confidential</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

/** Inline styles for a text run (bold/italic/underline/strike + colour). */
function runStyle(run: ReportTextRun): Record<string, string> {
  const style: Record<string, string> = {};
  if (run.bold) style.fontWeight = '700';
  if (run.italic) style.fontStyle = 'italic';
  if (run.underline && !run.strike) style.textDecoration = 'underline';
  if (run.strike) style.textDecoration = 'line-through';
  if (run.color) style.color = run.color;
  return style;
}

/** Branded PDF document built from the lexical report model. */
export function HealthReportDocument({ model }: { model: ExportModel }) {
  return (
    <Document
      title={`${model.title} — Deni Sawa Partners`}
      author="Deni Sawa Partners"
      creator="Deni Sawa Partners"
      subject="Diagnostic Health Report"
    >
      <Page size="A4" style={styles.page}>
        <ReportHeader title={model.title} />
        <View style={styles.accentBar} />

        {model.blocks.map((block, i) => {
          switch (block.kind) {
            case 'heading': {
              const headingStyle =
                block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
              return (
                <Text
                  key={i}
                  style={[
                    headingStyle,
                    block.backgroundColor
                      ? { backgroundColor: block.backgroundColor, paddingHorizontal: 4, paddingVertical: 2 }
                      : undefined,
                  ]}
                >
                  {block.runs?.map((run, j) => (
                    <Text key={j} style={runStyle(run)}>
                      {run.text}
                    </Text>
                  ))}
                </Text>
              );
            }
            case 'paragraph':
              return (
                <Text
                  key={i}
                  style={[
                    styles.paragraph,
                    block.backgroundColor
                      ? { backgroundColor: block.backgroundColor, paddingHorizontal: 4 }
                      : undefined,
                  ]}
                >
                  {block.runs?.map((run, j) => (
                    <Text key={j} style={runStyle(run)}>
                      {run.text}
                    </Text>
                  ))}
                </Text>
              );
            case 'quote':
              return (
                <Text key={i} style={styles.quote}>
                  {block.text}
                </Text>
              );
            case 'callout':
              return (
                <View
                  key={i}
                  style={[
                    styles.callout,
                    ...(block.tone === 'growth' ? [styles.calloutGrowth] : []),
                  ]}
                >
                  <Text
                    style={[
                      styles.calloutLabel,
                      ...(block.tone === 'growth' ? [styles.calloutLabelGrowth] : []),
                    ]}
                  >
                    {block.tone === 'growth' ? 'Note' : 'Priority'}
                  </Text>
                  <Text style={styles.calloutText}>{block.text}</Text>
                </View>
              );
            case 'list':
              return (
                <View key={i} style={styles.list}>
                  {block.items?.map((item, j) => (
                    <View key={j} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            case 'divider':
            default:
              return <View key={i} style={styles.divider} />;
          }
        })}
        <ReportFooter />
      </Page>
    </Document>
  );
}

export { healthChecks };
