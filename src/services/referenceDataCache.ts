import { Repository } from 'typeorm';
import { Driver } from '../entities/Driver';
import { Vehicle } from '../entities/Vehicle';
import { Employee } from '../entities/Employee';

class ReferenceDataCache {
  private drivers: Driver[] | null = null;
  private vehicles: Vehicle[] | null = null;
  private employees: Employee[] | null = null;

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

  async getEmployees(employeeRepository: Repository<Employee>): Promise<Employee[]> {
    if (this.employees) {
      return this.employees;
    }

    this.employees = await employeeRepository.find({
      order: { firstName: 'ASC', lastName: 'ASC' },
      select: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'preferredNotifyEmail', 'department', 'position', 'isActive', 'phone', 'createdAt', 'updatedAt']
    });

    return this.employees;
  }

  invalidateDrivers(): void {
    this.drivers = null;
  }

  invalidateVehicles(): void {
    this.vehicles = null;
  }

  invalidateEmployees(): void {
    this.employees = null;
  }
}

export default new ReferenceDataCache();
