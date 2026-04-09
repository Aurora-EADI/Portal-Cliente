import fs from 'fs';
const p = 'c:/Users/lucas.silva/Documents/portal/Portal-Aurora/aurora-eadi-front/src/components/pages/armazem-geral/carga-geral/RegisterCargoModal.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/location: '',\s+}\);/g, "location: '',\n    cifValue: undefined,\n    documents: [],\n  });");

txt = txt.replace(/location: editingCargo\.location \|\| '',/g, "location: editingCargo.location || '',\n        cifValue: editingCargo.cifValue ? Number(editingCargo.cifValue) : undefined,\n        documents: editingCargo.documents && editingCargo.documents.length > 0 ? editingCargo.documents : (editingCargo.documentNumber ? [{ type: editingCargo.documentType || 'NOTA_REMESSA', number: editingCargo.documentNumber }] : []),");

txt = txt.replace(/volume: 0,\n        location: '',\n    }\);/g, "volume: 0,\n        location: '',\n        cifValue: undefined,\n        documents: [],\n    });");

txt = txt.replace(/const payload: any = \{([\s\S]*?)quantity:.+?,/g, `const payload: any = {\n$1quantity: !isNaN(Number(formData.quantity)) && Number(formData.quantity) > 0 ? Number(formData.quantity) : 1,\n        cifValue: formData.cifValue ? Number(formData.cifValue) : undefined,\n        documents: formData.documents?.filter(d => Boolean(d.number)) || undefined,`);

txt = txt.replace(/\{\/\* Documento Section \*\/\}[\s\S]*?\{\/\* Physical details grid \*\/\}/, `{/* Documento Section */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={14} className="text-primary-500" /> Documentação
                    </Label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] uppercase font-bold text-primary-600 hover:bg-primary-50"
                        onClick={() => setFormData({ ...formData, documents: [...(formData.documents || []), { type: 'NOTA_REMESSA', number: '' }] })}
                    >
                        <Plus size={12} className="mr-1" /> Adicionar
                    </Button>
                </div>

                {formData.documents && formData.documents.map((doc, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 animate-in zoom-in-95 duration-200">
                        <div className="col-span-2">
                            <Select 
                                value={doc.type || ''} 
                                onValueChange={(v) => {
                                    const newDocs = [...formData.documents!];
                                    newDocs[idx].type = v;
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                            >
                                <SelectTrigger className="bg-white border-gray-200 h-10 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOTA_REMESSA">Nota de Remessa</SelectItem>
                                    <SelectItem value="DI">DI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Input
                                placeholder="Número"
                                value={doc.number || ''}
                                onChange={(e) => {
                                    const newDocs = [...formData.documents!];
                                    newDocs[idx].number = e.target.value;
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                                className="bg-white border-gray-200 h-10 text-xs font-mono"
                            />
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                    const newDocs = formData.documents!.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
              </div>

              {/* Physical details grid */}`);

txt = txt.replace(/<Label htmlFor="volume" className="text-gray-600 font-semibold italic flex items-center gap-2">[\s\S]*?<\/div>/, `<Label htmlFor="volume" className="text-gray-600 font-semibold italic flex items-center gap-2">
                        <Ruler size={14} className="text-gray-400" /> Volume (m\u00b3)
                    </Label>
                    <Input
                        id="volume"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })}
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cifValue" className="text-gray-600 font-semibold">Valor CIF (R$)</Label>
                    <Input
                        id="cifValue"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.cifValue || ''}
                        onChange={(e) => setFormData({ ...formData, cifValue: e.target.value ? Number(e.target.value) : undefined })}
                        className="h-11 bg-gray-50 border-gray-200 font-mono"
                    />
                </div>`);

fs.writeFileSync(p, txt);
