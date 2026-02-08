import { NotFoundError } from '../../src/utils/errors';

// Define mock functions first to avoid circular reference issues
const mockModuleFindMany = jest.fn();
const mockModuleFindUnique = jest.fn();
const mockModuleCreate = jest.fn();
const mockModuleUpdate = jest.fn();
const mockModuleDelete = jest.fn();
const mockCourseFindUnique = jest.fn();
const mockTransaction = jest.fn();

// Create a mock PrismaClient that will be used throughout the tests
const mockPrismaClient = {
  module: {
    findMany: mockModuleFindMany,
    findUnique: mockModuleFindUnique,
    create: mockModuleCreate,
    update: mockModuleUpdate,
    delete: mockModuleDelete,
  },
  course: {
    findUnique: mockCourseFindUnique,
  },
  $connect: jest.fn().mockResolvedValue({}),
  $disconnect: jest.fn().mockResolvedValue({}),
  $on: jest.fn(),
  $transaction: mockTransaction.mockImplementation(cb => cb(mockPrismaClient))
};

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

// IMPORTANT: Mock the actual import used in the service
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient
}));

// Now import the service AFTER the mocks are set up
import * as moduleService from '../../src/modules/modules/modules.service';

describe('Modules Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- findModules ---
  describe('findModules', () => {
    const mockModules = [
      {
        id: 1,
        title: 'Module 1',
        order: 1,
        course: { id: 1, title: 'Course 1', level: 'BEGINNER' },
        _count: { lessons: 5 },
      },
    ];

    it('returns all modules when no courseId provided', async () => {
      mockModuleFindMany.mockResolvedValue(mockModules);
      const result = await moduleService.findModules();

      expect(mockModuleFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { order: 'asc' },
        include: {
          course: { select: { id: true, title: true, level: true } },
          _count: { select: { lessons: true } },
        },
      });
      expect(result).toEqual(mockModules);
    });

    it('filters by courseId if provided', async () => {
      mockModuleFindMany.mockResolvedValue(mockModules);
      const result = await moduleService.findModules({ courseId: 1 });

      expect(mockModuleFindMany).toHaveBeenCalledWith({
        where: { courseId: 1 },
        orderBy: { order: 'asc' },
        include: {
          course: { select: { id: true, title: true, level: true } },
          _count: { select: { lessons: true } },
        },
      });
      expect(result).toEqual(mockModules);
    });
  });

  // --- findModuleById ---
  describe('findModuleById', () => {
    const mockModule = {
      id: 1,
      title: 'Module 1',
      course: { id: 1, title: 'Course 1', level: 'BEGINNER' },
      lessons: [
        {
          id: 1,
          title: 'Lesson 1',
          order: 1,
          _count: { exercises: 3 },
        },
      ],
    };

    it('returns a module when found', async () => {
      mockModuleFindUnique.mockResolvedValue(mockModule);
      const result = await moduleService.findModuleById(1);

      expect(mockModuleFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          course: { select: { id: true, title: true, level: true } },
          lessons: {
            orderBy: { order: 'asc' },
            include: { _count: { select: { exercises: true } } },
          },
        },
      });
      expect(result).toEqual(mockModule);
    });

    it('throws NotFoundError when module not found', async () => {
      mockModuleFindUnique.mockResolvedValue(null);
      await expect(moduleService.findModuleById(999)).rejects.toThrow(
        new NotFoundError('Module with ID 999 not found')
      );
    });
  });

  // --- createModule ---
  describe('createModule', () => {
    const mockCourse = { id: 1, title: 'Course 1' };
    const createData = {
      courseId: 1,
      title: 'New Module',
      description: 'Module description',
      order: 1,
      isLocked: false,
    };
    const mockCreated = {
      id: 1,
      ...createData,
      course: { id: 1, title: 'Course 1' },
    };

    it('creates module if course exists', async () => {
      mockCourseFindUnique.mockResolvedValue(mockCourse);
      mockModuleCreate.mockResolvedValue(mockCreated);
      const result = await moduleService.createModule(createData);

      expect(mockCourseFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockModuleCreate).toHaveBeenCalledWith({
        data: createData,
        include: { course: { select: { id: true, title: true } } },
      });
      expect(result).toEqual(mockCreated);
    });

    it('assigns default isLocked=false if omitted', async () => {
      mockCourseFindUnique.mockResolvedValue(mockCourse);
      mockModuleCreate.mockResolvedValue(mockCreated);

      await moduleService.createModule({ courseId: 1, title: 'New Module', order: 1 });
      expect(mockModuleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isLocked: false, description: undefined }),
        })
      );
    });

    it('throws NotFoundError if course missing', async () => {
      mockCourseFindUnique.mockResolvedValue(null);
      await expect(moduleService.createModule(createData)).rejects.toThrow(
        new NotFoundError('Course with ID 1 not found')
      );
    });
  });

  // --- updateModule ---
  describe('updateModule', () => {
    const mockExisting = { id: 1, title: 'Old' };
    const updateData = { title: 'New Title', description: 'Desc' };
    const mockUpdated = { id: 1, ...updateData, course: { id: 1, title: 'Course 1' } };

    it('updates a found module', async () => {
      mockModuleFindUnique.mockResolvedValue(mockExisting);
      mockModuleUpdate.mockResolvedValue(mockUpdated);
      const result = await moduleService.updateModule(1, updateData);

      expect(mockModuleFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockModuleUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: { course: { select: { id: true, title: true } } },
      });
      expect(result).toEqual(mockUpdated);
    });

    it('throws NotFoundError if module missing', async () => {
      mockModuleFindUnique.mockResolvedValue(null);
      await expect(moduleService.updateModule(999, updateData)).rejects.toThrow(
        new NotFoundError('Module with ID 999 not found')
      );
    });
  });

  // --- deleteModule ---
  describe('deleteModule', () => {
    const mockExisting = { id: 1, title: 'To Delete' };

    it('deletes a found module', async () => {
      mockModuleFindUnique.mockResolvedValue(mockExisting);
      mockModuleDelete.mockResolvedValue(mockExisting);
      const result = await moduleService.deleteModule(1);

      expect(mockModuleFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockModuleDelete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockExisting);
    });

    it('throws NotFoundError if module missing', async () => {
      mockModuleFindUnique.mockResolvedValue(null);
      await expect(moduleService.deleteModule(999)).rejects.toThrow(
        new NotFoundError('Module with ID 999 not found')
      );
    });
  });

  // --- findModulesByCourseId ---
  describe('findModulesByCourseId', () => {
    const mockCourse = { id: 1, title: 'Course 1' };
    const mockMods = [
      {
        id: 1,
        title: 'Mod',
        order: 1,
        lessons: [
          { id: 1, title: 'L1', order: 1, _count: { exercises: 3 } },
        ],
      },
    ];

    it('returns modules if course exists', async () => {
      mockCourseFindUnique.mockResolvedValue(mockCourse);
      mockModuleFindMany.mockResolvedValue(mockMods);
      const result = await moduleService.findModulesByCourseId(1);

      expect(mockCourseFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockModuleFindMany).toHaveBeenCalledWith({
        where: { courseId: 1 },
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
              _count: { select: { exercises: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockMods);
    });

    it('throws NotFoundError if course missing', async () => {
      mockCourseFindUnique.mockResolvedValue(null);
      await expect(moduleService.findModulesByCourseId(999)).rejects.toThrow(
        new NotFoundError('Course with ID 999 not found')
      );
    });
  });
});