import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import locationData from '@/data/nepal_location.json';
import { useEffect, useRef, useState } from 'react';
import NepaliDate from 'nepali-date-converter';

export const KYCAdd = () => {
  const { t } = useLanguage();


  // Date of Birth State
  const [dobAD, setDobAD] = useState("");
  const [dobBS, setDobBS] = useState("");

  // Handle AD Date change → Auto convert to BS
  const handleAdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const adValue = e.target.value;
    setDobAD(adValue);

    if (adValue) {
      const adDateObj = new Date(adValue);
      const bsDate = NepaliDate.fromAD(adDateObj);
      const bsFormatted = bsDate.format("YYYY-MM-DD"); // e.g. 2081-08-03
      setDobBS(bsFormatted);
    } else {
      setDobBS("");
    }
  };

  const provines = locationData.provinceList;
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const districts = provinceId
    ? provines.find((p) => p.id === Number(provinceId))?.districtList || []
    : [];
  const municipalities = districtId
    ? districts.find((d) => d.id === Number(districtId))
      ?.municipalityList || []
    : [];


  const attachments = [
    'Blue Book',
    'Citizenship',
    'Company Stamp in KYC Form',
    'Contact Person\'s ID Card',
    'Copy of Insured\'s PAN Certificate',
    'Copy of Insured\'s Registration Certificate',
    'Copy of Signatory/Owner\'s Citizenship/ID Card issued by Government Office',
    'Identity Card',
    'License',
    'Other required documents',
    'Passport',
    'Photo',
    'Photo of Signatory/Owner',
    'Signature of Signatory/Owner in KYC Form',
  ];


  const [english, setEnglish] = useState("");
  const [nepali, setNepali] = useState("");

  const handleEnglishChange = async (e) => {
    const text = e.target.value;
    setEnglish(text);

    if (!text.trim()) {
      setNepali("");
      return;
    }

    // Google Translate unofficial API
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ne&dt=t&q=" +
      encodeURI(text);

    try {
      const res = await fetch(url);
      const data = await res.json();
      setNepali(data[0][0][0]); // Nepali translation
    } catch (err) {
      console.error("Translation error:", err);
    }
  };



  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("pen"); // pen | eraser

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000"; // Black pen

    ctxRef.current = ctx;
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  // 🔵 Pen Mode
  const setPen = () => {
    setMode("pen");
    ctxRef.current.globalCompositeOperation = "source-over";
    ctxRef.current.strokeStyle = "#000000";
    ctxRef.current.lineWidth = 3;
  };

  // 🧽 Eraser Mode
  const setEraser = () => {
    setMode("eraser");
    ctxRef.current.globalCompositeOperation = "destination-out";
    ctxRef.current.lineWidth = 20;
  };

  // 🧹 Clear Canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 bg-background">
          <Tabs defaultValue="self" className="w-full max-w-6xl">
            <TabsList className="bg-muted mb-6">
              <TabsTrigger
                value="self"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t('claim.self')}
              </TabsTrigger>
              <TabsTrigger
                value="others"
                className="data-[state=active]:bg-background"
              >
                {t('claim.others')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.basicInfo')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('kycAdd.fullName')} *</Label>
                    <Input className="mt-2" value={english} onChange={handleEnglishChange} placeholder='type english' />
                  </div>
                  <div>
                    <Label>{t('kycAdd.fullName')} (नेपालीमा) *</Label>
                    <Input className="mt-2" value={nepali} placeholder='neali output' />
                  </div>
                  <div>
                    <Label>{t('kycAdd.gender')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.maritalStatus')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('auth.mobileNo')} *</Label>
                    <Input type="tel" defaultValue="9851139976" className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.email')}</Label>
                    <Input type="email" className="mt-2" />
                  </div>
                  {/* Date of Birth (B.S) */}
                  <div>
                    <Label>{t("kycAdd.dateOfBirth")}</Label>
                    <Input className="mt-2" value={dobBS} readOnly placeholder="Select A.D Date" />
                  </div>

                  {/* Place of Birth */}
                  <div>
                    <Label>{t("kycAdd.placeOfBirth")}</Label>
                    <Input className="mt-2" />
                  </div>

                  {/* Date of Birth (A.D) */}
                  <div>
                    <Label>{t("kycAdd.dateOfBirth")} (A.D)</Label>
                    <Input
                      type="date"
                      className="mt-2"
                      value={dobAD}
                      onChange={handleAdChange}
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.permanentAddress')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Province */}
                  <div>
                    <Label>{t("kycAdd.province")}</Label>
                    <Select
                      value={provinceId}
                      onValueChange={(value) => {
                        setProvinceId(value);
                        setDistrictId("");
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provines.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* District */}
                  <div>
                    <Label>{t("kycAdd.district")}</Label>
                    <Select
                      value={districtId}
                      disabled={!provinceId}
                      onValueChange={(value) => setDistrictId(value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Municipality */}
                  <div>
                    <Label>{t("kycAdd.municipality")}</Label>
                    <Select disabled={!districtId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select Municipality" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.tole')} *</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>टोल (नेपालीमा) *</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.wardNumber')} *</Label>
                    <Input className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Temporary Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.temporaryAddress')}</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox id="sameAddress" />
                  <Label htmlFor="sameAddress">{t('kycAdd.sameAsPermanent')}</Label>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('kycAdd.temporaryAddress')}</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>अस्थायी ठेगाना (नेपालीमा)</Label>
                    <Input className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Others */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.others')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('kycAdd.occupation')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.incomeSource')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.kycClassification')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.citizenshipNumber')} *</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.citizenshipIssuedDistrict')}</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Citizenship issued Date(R.S)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ktm">Kathmandu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('kycAdd.citizenshipIssuedDate')}</Label>
                    <Input type="date" className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.grandFatherName')}</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.fatherName')} *</Label>
                    <Input className="mt-2" />
                  </div>
                  <div>
                    <Label>{t('kycAdd.motherName')}</Label>
                    <Input className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.attachments')}</h3>
                <p className="text-sm text-blue-500 mb-4">{t('kycAdd.doYouWantToAttach')}</p>

                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div key={attachment} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">{attachment}</span>
                      <Button variant="outline" size="sm" className="gap-2 text-orange-500 border-orange-200 hover:bg-orange-50">
                        <Upload className="w-4 h-4" />
                        {t('kycAdd.clickToUpload')}
                        <span className="text-xs text-muted-foreground">PNG, JPEG, JPG</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* E-Signature */}
              <div>
                <h3 className="text-lg font-semibold mb-4">E-Signature</h3>

                {/* Canvas Box */}
                <div className="border-2 border-dashed rounded-lg h-64 mb-4 relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseLeave={stopDrawing}
                  ></canvas>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={setPen}
                    className={`px-4 py-2 rounded-md border ${mode === "pen" ? "text-blue-600 border-blue-600" : ""
                      }`}
                  >
                    Pen
                  </button>

                  <button
                    onClick={setEraser}
                    className={`px-4 py-2 rounded-md border ${mode === "eraser" ? "text-red-600 border-red-600" : ""
                      }`}
                  >
                    Eraser
                  </button>

                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 rounded-md border"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Business Branch */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('kycAdd.businessBranch')}</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('kycAdd.selectBusinessBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damak">Damak, Municipality-11, Damak (Damak)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  {t('common.next')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="others">
              <p className="text-center text-muted-foreground py-12">
                {t('kycAdd.others')} form content
              </p>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

