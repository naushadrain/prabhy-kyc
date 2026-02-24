// src/components/DocumentUploadSection.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUpload } from './DocumentUpload';
import { Label } from '@/components/ui/label';

interface DocumentIds {
  passportFrontId?: string;
  passportBackId?: string;
  childDocuments?: Record<string, { frontId?: string; backId?: string }>;
}

interface DocumentUploadSectionProps {
  classId: string;
  passportNumber: string;
  onDocumentsChange: (docIds: DocumentIds) => void;
  hasChildren?: boolean;
  childrenList?: Array<{ name: string; passport: string; index: number }>;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  classId,
  passportNumber,
  onDocumentsChange,
  hasChildren = false,
  childrenList = [],
}) => {
  const [docIds, setDocIds] = useState<DocumentIds>({
    passportFrontId: undefined,
    passportBackId: undefined,
    childDocuments: {},
  });

  const handleParentUpload = (imageId: string, docIdType: string) => {
    const newDocIds = { ...docIds };
    if (docIdType === 'PF') {
      newDocIds.passportFrontId = imageId;
    } else if (docIdType === 'PB') {
      newDocIds.passportBackId = imageId;
    }
    setDocIds(newDocIds);
    onDocumentsChange(newDocIds);
  };

  const handleChildUpload = (
    childIndex: number,
    imageId: string,
    docIdType: string,
    childPassport: string
  ) => {
    const newDocIds = { ...docIds };
    if (!newDocIds.childDocuments) {
      newDocIds.childDocuments = {};
    }
    if (!newDocIds.childDocuments[childPassport]) {
      newDocIds.childDocuments[childPassport] = {};
    }
    
    if (docIdType === 'PF') {
      newDocIds.childDocuments[childPassport].frontId = imageId;
    } else if (docIdType === 'PB') {
      newDocIds.childDocuments[childPassport].backId = imageId;
    }
    
    setDocIds(newDocIds);
    onDocumentsChange(newDocIds);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parent Documents */}
        <div className="space-y-4">
          <h3 className="font-medium">Parent/Policy Holder Documents</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <DocumentUpload
              classId={classId}
              docType="Passport"
              docIdType="PF" // Passport Front
              imageId={passportNumber}
              onUploadSuccess={handleParentUpload}
              label="Passport Front"
            />
            
            <DocumentUpload
              classId={classId}
              docType="Passport"
              docIdType="PB" // Passport Back
              imageId={passportNumber}
              onUploadSuccess={handleParentUpload}
              label="Passport Back"
            />
          </div>
        </div>

        {/* Child Documents */}
        {hasChildren && childrenList.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Children Documents</h3>
            {childrenList.map((child, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-3">
                <Label>Child: {child.name} (Passport: {child.passport})</Label>
                <div className="grid md:grid-cols-2 gap-6">
                  <DocumentUpload
                    classId={classId}
                    docType="Passport"
                    docIdType="PF"
                    imageId={child.passport}
                    onUploadSuccess={(imageId, docIdType) => 
                      handleChildUpload(idx, imageId, docIdType, child.passport)
                    }
                    label={`${child.name} - Passport Front`}
                  />
                  
                  <DocumentUpload
                    classId={classId}
                    docType="Passport"
                    docIdType="PB"
                    imageId={child.passport}
                    onUploadSuccess={(imageId, docIdType) => 
                      handleChildUpload(idx, imageId, docIdType, child.passport)
                    }
                    label={`${child.name} - Passport Back`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};