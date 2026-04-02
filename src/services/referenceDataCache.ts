import { Repository } from 'typeorm';
import { Driver } from '../entities/Driver';
import { Vehicle } from '../entities/Vehicle';

class ReferenceDataCache {
  private drivers: Driver[] | null = null;
  private vehicles: Vehicle[] | null = null;

  async getDrivers(driverRepository: Repository<Driver>): Promise<Driver[]> {
    if (this.drivers) {
      return this.drivers;
    }

    this.drivers = await driverRepository.find({
      order: { createdAt: 'DESC' },
    });

    return this.drivers;
  }

  async getVehicles(vehicleRepository: Repository<Vehicle>): Promise<Vehicle[]> {
    if (this.vehicles) {
      return this.vehicles;
    }

    this.vehicles = await vehicleRepository.find({
      order: { createdAt: 'DESC' },
    });

    return this.vehicles;
  }

  invalidateDrivers(): void {
    this.drivers = null;
  }

  invalidateVehicles(): void {
    this.vehicles = null;
  }
}

export default new ReferenceDataCache();
