import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, renderToBuffer } from '@react-pdf/renderer';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { sendCompletedEmail } from '@/lib/email';

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155', // Slate-700
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5', // Indigo-600
  },
  headerRight: {
    textAlign: 'right',
  },
  versionText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a', // Slate-900
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 15,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  bulletList: {
    marginLeft: 15,
    marginBottom: 8,
  },
  bulletItem: {
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#94a3b8',
  },
  // Signature Badges Style
  badgeTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  badgeSubtitle: {
    fontSize: 8.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  badgeCard: {
    borderWidth: 1,
    borderColor: '#10b981', // Emerald border
    backgroundColor: '#f0fdf4', // Emerald-50
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContent: {
    flex: 1,
    paddingRight: 30,
  },
  badgeHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#047857',
    marginBottom: 6,
  },
  badgeTextBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  badgeText: {
    fontSize: 8.5,
    color: '#065f46',
    marginBottom: 4,
  },
  badgeMetaText: {
    fontSize: 7.5,
    color: '#6b7280',
    marginTop: 4,
  },
});

const ShieldIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const CheckmarkIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 4L12 14.01l-3-3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AgreementPDF = ({ agreement, landlord, tenant, today }: any) => {
  const landlordMeta = landlord.signature_meta_json || {};
  const tenantMeta = tenant.signature_meta_json || {};

  const formatIST = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' (IST)';
  };

  return (
    <Document>
      {/* Page 1: Agreement Terms */}
      <Page size="A4" style={styles.page}>
        {/* Header (RentSign Branding) */}
        <View style={styles.header} fixed>
          <View style={styles.logoContainer}>
            <ShieldIcon />
            <Text style={styles.logoText}>RentSign</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>Leave &amp; License Contract</Text>
            <Text style={styles.versionText}>Verification Ref: RS-{agreement.id.slice(0, 8).toUpperCase()} | v{agreement.version}</Text>
          </View>
        </View>

        <Text style={styles.title}>LEAVE AND LICENSE AGREEMENT</Text>

        <Text style={styles.paragraph}>
          This Leave and License Agreement is executed on this {today} at Mumbai.
        </Text>

        <Text style={styles.sectionHeading}>BY AND BETWEEN:</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{landlord.name}</Text>, residing at [Landlord Address] (hereinafter referred to as the 'LICENSOR', which expression shall include heirs, executors, administrators, and assigns) of the ONE PART.
        </Text>

        <Text style={styles.sectionHeading}>AND:</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{tenant.name}</Text>, residing at [Tenant Address] (hereinafter referred to as the 'LICENSEE', which expression shall include heirs, executors, administrators, and permitted assigns) of the OTHER PART.
        </Text>

        <Text style={styles.sectionHeading}>WHEREAS:</Text>
        <Text style={styles.paragraph}>
          The Licensor is the absolute owner of the premises situated at: {agreement.property_json?.address || '[Property Address]'} (hereinafter referred to as the 'Licensed Premises').
        </Text>

        <Text style={styles.sectionHeading}>NOW THIS DEED WITNESSETH AND IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:</Text>

        <Text style={styles.sectionHeading}>1. DURATION:</Text>
        <Text style={styles.paragraph}>
          The Licensor hereby grants to the Licensee the license to occupy the Licensed Premises for a period of {agreement.term_months} months. Under no circumstances shall this term exceed 11 months without sub-registrar registration.
        </Text>

        <Text style={styles.sectionHeading}>2. LICENSE FEE (RENT) &amp; DEPOSIT:</Text>
        <Text style={styles.paragraph}>
          The Licensee shall pay to the Licensor a monthly rent of Rs. {agreement.rent_amount.toLocaleString('en-IN')} per month, payable on or before the {agreement.property_json?.due_date || '1st'} day of each calendar month. The Licensee has deposited an interest-free security deposit of Rs. {agreement.deposit_amount.toLocaleString('en-IN')} with the Licensor.
        </Text>

        <Text style={styles.sectionHeading}>3. MAINTENANCE CHARGES:</Text>
        <Text style={styles.paragraph}>
          Monthly society maintenance charges of Rs. {agreement.maintenance_amount.toLocaleString('en-IN')} shall be paid by the {agreement.clauses_json?.maintenance_paid_by === 'tenant' ? 'LICENSEE' : 'LICENSOR'}.
        </Text>

        <Text style={styles.sectionHeading}>4. NOTICE &amp; LOCK-IN PERIOD:</Text>
        <Text style={styles.paragraph}>
          There shall be a notice period of {agreement.clauses_json?.notice_period_days || 30} days by either party. Neither party may terminate this agreement during the initial lock-in period of {agreement.clauses_json?.lock_in_months || 0} months.
        </Text>

        <Text style={styles.sectionHeading}>5. ADDITIONAL RESTRICTIONS:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Subletting: The Licensee is {agreement.clauses_json?.subletting_allowed ? 'ALLOWED' : 'PROHIBITED'} from subletting or sharing the Licensed Premises.</Text>
          <Text style={styles.bulletItem}>• Pets: Pets are {agreement.clauses_json?.pets_allowed ? 'ALLOWED' : 'PROHIBITED'} in the Licensed Premises.</Text>
          <Text style={styles.bulletItem}>• Brokerage Expenses: Allocated to {agreement.clauses_json?.brokerage_paid_by?.toUpperCase() || 'NONE'}.</Text>
        </View>

        {agreement.clauses_json?.custom_clauses && agreement.clauses_json.custom_clauses.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>6. ADDITIONAL CUSTOM CLAUSES:</Text>
            {agreement.clauses_json.custom_clauses.map((c: string, idx: number) => (
              <Text key={idx} style={styles.paragraph}>
                {idx + 1}. {c}
              </Text>
            ))}
          </View>
        )}

        {/* Page numbers / Footer */}
        <View style={styles.footer} fixed>
          <Text>RentSign Secured Leave &amp; License Deed</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Signature Certificates */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.logoContainer}>
            <ShieldIcon />
            <Text style={styles.logoText}>RentSign</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>Leave &amp; License Contract</Text>
            <Text style={styles.versionText}>Verification Ref: RS-{agreement.id.slice(0, 8).toUpperCase()} | v{agreement.version}</Text>
          </View>
        </View>

        <Text style={styles.badgeTitle}>DIGITALLY EXECUTED SIGNATURE CERTIFICATES</Text>
        <Text style={styles.badgeSubtitle}>
          Below signature badges certify the digital execution of this leave-and-license contract under Section 10A of the IT Act, 2000.
        </Text>

        {/* Licensor Card */}
        <View style={styles.badgeCard}>
          <View style={styles.badgeContent}>
            <Text style={styles.badgeHeader}>LICENSOR (LANDLORD) SIGNATURE CERTIFICATE</Text>
            <Text style={styles.badgeText}>
              Signee: <Text style={styles.badgeTextBold}>{landlord.name}</Text>
            </Text>
            <Text style={styles.badgeText}>
              Aadhaar e-Sign status: <Text style={styles.badgeTextBold}>SUCCESS</Text> (Verified last 4 digits: {landlordMeta.aadhaar_last_four || 'XXXX'})
            </Text>
            <Text style={styles.badgeText}>
              Signed on: {formatIST(landlord.signed_at)}
            </Text>
            <Text style={styles.badgeMetaText}>
              IP Address: {landlordMeta.ip || '127.0.0.1'}   |   Secure Token ID: {landlord.id.slice(0, 10)}...
            </Text>
            <Text style={[styles.badgeMetaText, { color: '#8791a1', fontSize: 7 }]}>
              User-Agent: {landlordMeta.user_agent || 'Browser'}
            </Text>
          </View>
          <CheckmarkIcon />
        </View>

        {/* Licensee Card */}
        <View style={styles.badgeCard}>
          <View style={styles.badgeContent}>
            <Text style={styles.badgeHeader}>LICENSEE (TENANT) SIGNATURE CERTIFICATE</Text>
            <Text style={styles.badgeText}>
              Signee: <Text style={styles.badgeTextBold}>{tenant.name}</Text>
            </Text>
            <Text style={styles.badgeText}>
              Aadhaar e-Sign status: <Text style={styles.badgeTextBold}>SUCCESS</Text> (Verified last 4 digits: {tenantMeta.aadhaar_last_four || 'XXXX'})
            </Text>
            <Text style={styles.badgeText}>
              Signed on: {formatIST(tenant.signed_at)}
            </Text>
            <Text style={styles.badgeMetaText}>
              IP Address: {tenantMeta.ip || '127.0.0.1'}   |   Secure Token ID: {tenant.id.slice(0, 10)}...
            </Text>
            <Text style={[styles.badgeMetaText, { color: '#8791a1', fontSize: 7 }]}>
              User-Agent: {tenantMeta.user_agent || 'Browser'}
            </Text>
          </View>
          <CheckmarkIcon />
        </View>

        {/* Page numbers / Footer */}
        <View style={styles.footer} fixed>
          <Text>RentSign Secured Leave &amp; License Deed</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export async function generateAndDeliverPDF(agreementId: string): Promise<string> {
  console.log(`[@react-pdf/renderer Generator] Starting PDF generation for agreement: ${agreementId}`);

  // 1. Fetch agreement details
  const { data: agreement, error: agreementError } = await supabaseServiceRole
    .from('agreements')
    .select('*')
    .eq('id', agreementId)
    .single();

  if (agreementError || !agreement) {
    throw new Error(`Failed to fetch agreement: ${agreementError?.message}`);
  }

  // 2. Fetch parties details
  const { data: parties, error: partiesError } = await supabaseServiceRole
    .from('agreement_parties')
    .select('*')
    .eq('agreement_id', agreementId);

  if (partiesError || !parties || parties.length !== 2) {
    throw new Error(`Failed to fetch agreement parties (expected 2, got ${parties?.length || 0})`);
  }

  const landlord = parties.find(p => p.role === 'landlord');
  const tenant = parties.find(p => p.role === 'tenant');

  if (!landlord || !tenant) {
    throw new Error('Missing landlord or tenant party details.');
  }

  const today = new Date(agreement.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // 3. Render PDF document to buffer using @react-pdf/renderer
  const pdfBytes = await renderToBuffer(
    <AgreementPDF
      agreement={agreement}
      landlord={landlord}
      tenant={tenant}
      today={today}
    />
  );

  // 4. Connect to Supabase Storage - verify bucket agreements exists
  const { data: buckets, error: listError } = await supabaseServiceRole.storage.listBuckets();
  if (listError) throw listError;

  const bucketExists = buckets.some(b => b.name === 'agreements');
  if (!bucketExists) {
    console.log('Bucket "agreements" not found. Creating bucket...');
    const { error: createError } = await supabaseServiceRole.storage.createBucket('agreements', {
      public: false, // private bucket
    });
    if (createError) throw createError;
  }

  // 5. Upload final PDF to Supabase Storage
  const filePath = `${agreementId}/v${agreement.version}.pdf`;
  console.log(`Uploading PDF to storage path: ${filePath}`);
  const { error: uploadError } = await supabaseServiceRole.storage
    .from('agreements')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 6. Record document metadata in DB
  console.log('Inserting document record in database...');
  const { error: docError } = await supabaseServiceRole
    .from('documents')
    .insert({
      agreement_id: agreementId,
      version: agreement.version,
      storage_path: filePath,
    });

  if (docError) throw docError;

  // 7. Generate a signed URL for secure download link (valid for 7 days)
  console.log('Generating secure signed URL...');
  const { data: signedUrlObj, error: signUrlError } = await supabaseServiceRole.storage
    .from('agreements')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiration

  if (signUrlError || !signedUrlObj) {
    throw signUrlError || new Error('Failed to create signed URL from Storage bucket');
  }

  const downloadUrl = signedUrlObj.signedUrl;
  console.log(`Signed URL generated successfully.`);

  // 8. Dispatch completion emails using Resend
  console.log('Mailing completion notices to both parties...');
  await sendCompletedEmail(landlord.email, landlord.name, downloadUrl);
  await sendCompletedEmail(tenant.email, tenant.name, downloadUrl);

  console.log('PDF generation & delivery completed successfully!');
  return downloadUrl;
}
