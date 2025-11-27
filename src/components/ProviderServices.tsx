import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, MoreVertical, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getProviderServices, uploadServiceImage, updateService, deleteService, toggleServiceActive } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ProviderServicesProps {
  onAddService?: () => void;
  onEditService?: (serviceId: string) => void;
  onDeleteService?: (serviceId: string) => void;
}

export function ProviderServices({
  onAddService,
  onEditService,
  onDeleteService,
}: ProviderServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    priceUnit: 'hour',
    minBooking: '1',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await getProviderServices();
      if (response.success) {
        setServices(response.services || []);
      }
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check total images limit (max 5)
    if (uploadedImages.length + files.length > 5) {
      toast.error('You can only upload up to 5 images per service');
      return;
    }

    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB.`);
        }

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
        }

        const response = await uploadServiceImage(file);
        return response.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleAddService = async () => {
    try {
      if (!formData.title || !formData.description || !formData.category || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (uploadedImages.length === 0) {
        toast.error('Please upload at least one image');
        return;
      }

      const { createService } = await import('../utils/api');
      await createService({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        priceUnit: formData.priceUnit,
        minBooking: parseInt(formData.minBooking),
        images: uploadedImages,
      });

      toast.success('Service created successfully!');
      setShowAddDialog(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        priceUnit: 'hour',
        minBooking: '1',
      });
      setUploadedImages([]);
      loadServices();
    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      // Reset images when dialog closes
      setUploadedImages([]);
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        priceUnit: 'hour',
        minBooking: '1',
      });
    }
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      priceUnit: service.price_unit || 'hour',
      minBooking: service.min_booking?.toString() || '1',
    });
    setUploadedImages(service.images || []);
    setShowEditDialog(true);
  };

  const handleUpdateService = async () => {
    try {
      if (!formData.title || !formData.description || !formData.category || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (uploadedImages.length === 0) {
        toast.error('Please upload at least one image');
        return;
      }

      await updateService(selectedService.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        priceUnit: formData.priceUnit,
        minBooking: parseInt(formData.minBooking),
        images: uploadedImages,
      });

      toast.success('Service updated successfully!');
      setShowEditDialog(false);
      setSelectedService(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        priceUnit: 'hour',
        minBooking: '1',
      });
      setUploadedImages([]);
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Failed to update service');
    }
  };

  const handleViewService = (service: any) => {
    setSelectedService(service);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (service: any) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteService(selectedService.id);
      toast.success('Service deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedService(null);
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    }
  };

  const handleToggleActive = async (service: any) => {
    try {
      await toggleServiceActive(service.id);
      toast.success(`Service ${service.active ? 'deactivated' : 'activated'} successfully!`);
      loadServices();
    } catch (error: any) {
      console.error('Error toggling service:', error);
      toast.error(error.message || 'Failed to toggle service status');
    }
  };

  return (
    <>
      <div className="pb-20 bg-gray-50">
        {/* Header */}
        <div className="sticky top-16 bg-white border-b border-gray-200 z-40 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2>My Services</h2>
              <p className="text-sm text-gray-600">{services.length} services</p>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Services List */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 h-24 animate-pulse bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2">No Services Yet</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Add your first service to start accepting bookings
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Service Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {service.images?.[0] ? (
                        <ImageWithFallback
                          src={service.images[0]}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Eye className="w-8 h-8" />
                        </div>
                      )}
                      {!service.active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <EyeOff className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="text-sm mb-1 truncate">{service.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {service.category}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditService(service)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewService(service)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(service)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                        <span>
                          ${service.price}/{service.price_unit || 'hour'}
                        </span>
                        <span>•</span>
                        <span>{service.total_bookings || 0} bookings</span>
                        <span>•</span>
                        <span>⭐ {service.rating || 0}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={service.active} 
                            onCheckedChange={() => handleToggleActive(service)}
                          />
                          <span className="text-xs text-gray-600">
                            {service.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service offering for your customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Service Images * (Max 5)</Label>
              <div className="space-y-3">
                {/* Image Preview Grid */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={url}
                          alt={`Service image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {uploadedImages.length < 5 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Images ({uploadedImages.length}/5)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, or WebP. Max 5MB per image.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Deep House Cleaning"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your service..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="repair">Repair & Maintenance</SelectItem>
                  <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                  <SelectItem value="tutoring">Tutoring</SelectItem>
                  <SelectItem value="moving">Moving & Delivery</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="event">Event Planning</SelectItem>
                  <SelectItem value="pet">Pet Care</SelectItem>
                  <SelectItem value="general">General Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceUnit">Per</Label>
                <Select
                  value={formData.priceUnit}
                  onValueChange={(value) => setFormData({ ...formData, priceUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBooking">Minimum Booking (hours/sessions)</Label>
              <Input
                id="minBooking"
                type="number"
                placeholder="1"
                value={formData.minBooking}
                onChange={(e) => setFormData({ ...formData, minBooking: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddService}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uploadingImages}
            >
              Create Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setSelectedService(null);
          setUploadedImages([]);
          setFormData({
            title: '',
            description: '',
            category: '',
            price: '',
            priceUnit: 'hour',
            minBooking: '1',
          });
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update your service details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Service Images * (Max 5)</Label>
              <div className="space-y-3">
                {/* Image Preview Grid */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={url}
                          alt={`Service image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {uploadedImages.length < 5 && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Images ({uploadedImages.length}/5)
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, or WebP. Max 5MB per image.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Service Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Deep House Cleaning"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your service..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="repair">Repair & Maintenance</SelectItem>
                  <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                  <SelectItem value="tutoring">Tutoring</SelectItem>
                  <SelectItem value="moving">Moving & Delivery</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="event">Event Planning</SelectItem>
                  <SelectItem value="pet">Pet Care</SelectItem>
                  <SelectItem value="general">General Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priceUnit">Per</Label>
                <Select
                  value={formData.priceUnit}
                  onValueChange={(value) => setFormData({ ...formData, priceUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-minBooking">Minimum Booking (hours/sessions)</Label>
              <Input
                id="edit-minBooking"
                type="number"
                placeholder="1"
                value={formData.minBooking}
                onChange={(e) => setFormData({ ...formData, minBooking: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateService}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uploadingImages}
            >
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Service Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        setShowViewDialog(open);
        if (!open) setSelectedService(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>
              View complete information about this service
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4 py-4">
              {/* Images */}
              {selectedService.images && selectedService.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedService.images.map((url: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={url}
                        alt={`${selectedService.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500">Title</Label>
                <p>{selectedService.title}</p>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="text-sm">{selectedService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Category</Label>
                  <p className="text-sm">{selectedService.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Price</Label>
                  <p className="text-sm">
                    ${selectedService.price}/{selectedService.price_unit || 'hour'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Min. Booking</Label>
                  <p className="text-sm">{selectedService.min_booking || 1} {selectedService.price_unit || 'hour'}(s)</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <p className="text-sm">
                    <Badge variant={selectedService.active ? "default" : "secondary"}>
                      {selectedService.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Rating</Label>
                  <p className="text-sm">⭐ {selectedService.rating || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Reviews</Label>
                  <p className="text-sm">{selectedService.total_reviews || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Bookings</Label>
                  <p className="text-sm">{selectedService.total_bookings || 0}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowViewDialog(false);
                handleEditService(selectedService);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedService?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
